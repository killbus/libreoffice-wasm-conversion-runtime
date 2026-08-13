[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$PreparationRoot,
  [Parameter(Mandatory = $true)][string]$FormalRoot,
  [Parameter(Mandatory = $true)][string]$InvocationMarker
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$PSNativeCommandUseErrorActionPreference = $false
. (Join-Path $PSScriptRoot 'attempt-8-command-launch.ps1')

$PreparationRoot = [IO.Path]::GetFullPath($PreparationRoot)
$FormalRoot = [IO.Path]::GetFullPath($FormalRoot)
$InvocationMarker = [IO.Path]::GetFullPath($InvocationMarker)
if (-not (Test-Path -LiteralPath $InvocationMarker -PathType Leaf)) { throw 'Formal invocation marker missing.' }
if (Test-Path -LiteralPath $FormalRoot) { throw 'Formal root already exists; no repair or rerun is permitted.' }

$Runtime = Join-Path $PreparationRoot 'runtime-repository'
$PdfHow = Join-Path $PreparationRoot 'pdfhow-repository'
$Extract = Join-Path $PreparationRoot 'release-extract'
$Prepared = Join-Path $PdfHow 'third_party\libreoffice-wasm-conversion-runtime-dev'
$Fixture = Join-Path $PreparationRoot 'sealed-inputs\pinned-input.docx'
$Evidence = Join-Path $FormalRoot 'evidence'
$CommandIndex = 0
New-Item -ItemType Directory -Path $FormalRoot, $Evidence | Out-Null

# The formal phase consumes only sealed local inputs. Package-manager network
# fallback and browser downloads are disabled; all inherited proxy variables
# point to a closed local port while localhost remains available to Playwright.
$env:CI = '1'
$env:PLAYWRIGHT_WORKERS = '1'
$env:PLAYWRIGHT_HTML_OPEN = 'never'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $PreparationRoot 'ms-playwright'
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
$env:OFFICE_BROWSER_DOCX_FIXTURE = $Fixture
$env:OFFICE_RUNTIME_ROOT = $Prepared
$env:ACCEPTANCE_RETRY_POLICY = 'forbidden'
$env:ACCEPTANCE_NETWORK_POLICY = 'offline-localhost-only'
$env:npm_config_offline = 'true'
$env:npm_config_prefer_offline = 'true'
$env:npm_config_fetch_retries = '0'
$env:npm_config_registry = 'http://127.0.0.1:9/'
$env:HTTP_PROXY = 'http://127.0.0.1:9'
$env:HTTPS_PROXY = 'http://127.0.0.1:9'
$env:ALL_PROXY = 'http://127.0.0.1:9'
$env:NO_PROXY = 'localhost,127.0.0.1,::1'
$env:GIT_TERMINAL_PROMPT = '0'

function Write-JsonFile {
  param([string]$Path, [object]$Value)
  [IO.File]::WriteAllText($Path, (($Value | ConvertTo-Json -Depth 20) + "`n"), [Text.UTF8Encoding]::new($false))
}

function Invoke-FormalGate {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds
  )
  $script:CommandIndex++
  $index = $script:CommandIndex
  $safeName = $Name -replace '[^a-zA-Z0-9._-]', '-'
  $prefix = Join-Path $Evidence ("{0:D2}-{1}" -f $index, $safeName)
  $resolved = Resolve-Attempt8Application $Executable
  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true
  $launch = Set-Attempt8ProcessCommand -StartInfo $startInfo -ResolvedExecutable $resolved -Arguments $Arguments
  $startedAt = (Get-Date).ToUniversalTime()
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $timedOut = $false
  if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
    $timedOut = $true
    $process.Kill($true)
    $process.WaitForExit()
  }
  $stdout = $stdoutTask.GetAwaiter().GetResult()
  $stderr = $stderrTask.GetAwaiter().GetResult()
  [IO.File]::WriteAllText("$prefix.stdout.log", $stdout)
  [IO.File]::WriteAllText("$prefix.stderr.log", $stderr)
  $exitCode = if ($timedOut) { $null } else { $process.ExitCode }
  $passed = (-not $timedOut -and $exitCode -eq 0)
  $record = [ordered]@{
    attemptNumber = 8; commandIndex = $index; name = $Name; phase = 'formal acceptance'
    networkPolicy = 'offline'; retryPermitted = $false; retryCount = 0
    startedAt = $startedAt.ToString('o'); completedAt = (Get-Date).ToUniversalTime().ToString('o')
    timeoutSeconds = $TimeoutSeconds; timedOut = $timedOut; exitCode = $exitCode; passed = $passed
    executable = $Executable; arguments = $Arguments; workingDirectory = $WorkingDirectory; launch = $launch
  }
  Write-JsonFile "$prefix.command.json" $record
  if (-not $passed) {
    Write-JsonFile (Join-Path $FormalRoot 'ATTEMPT-8-FORMAL-FAILURE.json') $record
    throw "Formal gate failed: $Name"
  }
}

Write-JsonFile (Join-Path $Evidence '00-formal-inputs.json') ([ordered]@{
  attemptNumber = 8; phase = 'formal acceptance'; networkPolicy = 'offline'
  networkEnforcement = @('sealed local inputs', 'no network-capable formal commands', 'package-manager offline mode', 'closed-port proxy sink')
  invocationMarker = $InvocationMarker; preparationRoot = $PreparationRoot
  retryPermitted = $false; backfillPermitted = $false
})

Invoke-FormalGate -Name 'node-candidate-positive-negative-reuse-recovery-abi-cleanup' -Executable 'node' -Arguments @('scripts/release-runtime/node-smoke-gate.cjs', '--extract', (Join-Path $Extract 'wasm'), '--input', $Fixture, '--work', (Join-Path $Evidence 'node-gate-work')) -WorkingDirectory $Runtime -TimeoutSeconds 900
Invoke-FormalGate -Name 'pdfhow-full-retry-free-chromium-candidate-gate' -Executable 'pnpm' -Arguments @('exec', 'playwright', 'test', 'tests/office-conversion/office-browser.playwright.ts', '--config=playwright.config.ts', '--reporter=line', '--workers=1', '--retries=0', '--repeat-each=1', '--trace=retain-on-failure', ("--output=" + (Join-Path $Evidence 'pdfhow-full-gate-output'))) -WorkingDirectory $PdfHow -TimeoutSeconds 900

$coldStarts = @()
for ($sample = 1; $sample -le 5; $sample++) {
  $env:OFFICE_COLD_START_SAMPLE = [string]$sample
  $sampleStarted = Get-Date
  Invoke-FormalGate -Name "pdfhow-cold-start-$sample" -Executable 'pnpm' -Arguments @('exec', 'playwright', 'test', 'tests/office-conversion/office-browser.playwright.ts', '--config=playwright.config.ts', '--grep=validates conversion, recovery, assets, and teardown in local-candidate mode', '--reporter=line', '--workers=1', '--retries=0', '--repeat-each=1', '--trace=retain-on-failure', ("--output=" + (Join-Path $Evidence "pdfhow-cold-start-$sample-output"))) -WorkingDirectory $PdfHow -TimeoutSeconds 900
  $coldStarts += [ordered]@{
    sample = $sample; passed = $true; retryCount = 0; independentPlaywrightProcess = $true
    durationSeconds = [Math]::Round(((Get-Date) - $sampleStarted).TotalSeconds, 3)
  }
  Remove-Item Env:OFFICE_COLD_START_SAMPLE -ErrorAction SilentlyContinue
}
Write-JsonFile (Join-Path $Evidence 'cold-start-summary.json') ([ordered]@{
  requiredSamples = 5; completedSamples = 5; allPassed = $true; samples = $coldStarts
})

Invoke-FormalGate -Name 'final-prepared-candidate-invariance' -Executable 'node' -Arguments @((Join-Path $PSScriptRoot 'attempt-8-verify-prepared-candidate.mjs'), '--candidate-root', $Prepared, '--expected-candidate-id', '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b', '--expected-native-root', (Join-Path $Extract 'wasm'), '--expected-wrapper-root', $Extract, '--expected-native-commit', '71d33678ed74872ebbb1bc37f5778143f8f5e401', '--expected-wrapper-commit', 'df3f73c789e6d2abf71cbcd75186118d2bbc795a', '--expected-run-id', '31211473147', '--expected-abi', 'lok-convert-document-v1', '--expected-native-schema-version', '1', '--expected-pthread-worker-mode', 'main-script') -WorkingDirectory $PSScriptRoot -TimeoutSeconds 300

$inventoryPath = Join-Path $Evidence 'formal-evidence-sha256.json'
$files = @(Get-ChildItem -LiteralPath $Evidence -File -Recurse | Where-Object FullName -ne $inventoryPath | Sort-Object FullName | ForEach-Object {
  [ordered]@{
    path = [IO.Path]::GetRelativePath($Evidence, $_.FullName).Replace('\', '/')
    bytes = $_.Length
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  }
})
Write-JsonFile $inventoryPath ([ordered]@{ attemptNumber = 8; offline = $true; retryPerformed = $false; files = $files })
Write-JsonFile (Join-Path $FormalRoot 'ATTEMPT-8-FORMAL-COMPLETED.json') ([ordered]@{
  attemptNumber = 8; status = 'passed'; completedAt = (Get-Date).ToUniversalTime().ToString('o')
  formalInvocationCount = 1; networkPolicy = 'offline'; commandsCompleted = $CommandIndex
  expectedCommands = 8; retryPerformed = $false; evidenceRoot = $Evidence
})
Write-Output "Attempt 8 formal completed offline with $CommandIndex gates."
