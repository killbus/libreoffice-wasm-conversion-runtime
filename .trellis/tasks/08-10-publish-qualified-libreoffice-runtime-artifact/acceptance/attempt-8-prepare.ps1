[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PinnedDocxFixture,
  [string]$PreparationRoot = 'D:\tmp\lo-runtime-acceptance-attempt-8-preparation',
  [ValidateRange(1, 10)]
  [int]$MaxAttempts = 3
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$PSNativeCommandUseErrorActionPreference = $false
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Attempt 8 preparation requires PowerShell 7 or later.' }
. (Join-Path $PSScriptRoot 'attempt-8-command-launch.ps1')

$PreparationRoot = [IO.Path]::GetFullPath($PreparationRoot)
$PinnedDocxFixture = [IO.Path]::GetFullPath($PinnedDocxFixture)
$Runtime = Join-Path $PreparationRoot 'runtime-repository'
$PdfHow = Join-Path $PreparationRoot 'pdfhow-repository'
$Download = Join-Path $PreparationRoot 'release-download'
$Extract = Join-Path $PreparationRoot 'release-extract'
$BrowserRoot = Join-Path $PreparationRoot 'ms-playwright'
$Logs = Join-Path $PreparationRoot 'preparation-logs'
$Prepared = Join-Path $PdfHow 'third_party\libreoffice-wasm-conversion-runtime-dev'
$LocalFixture = Join-Path $PreparationRoot 'sealed-inputs\pinned-input.docx'
$ArchiveVerification = Join-Path $PreparationRoot 'archive-verification-report.json'
$ContractWork = Join-Path $PreparationRoot 'preparation-contract-work'
$ContractReport = Join-Path $PreparationRoot 'preparation-contract-test.json'

$RuntimeCommit = '54b64eafe922552239d5a9d09d0442b5eda5d9f0'
$PdfHowCommit = 'b41fde5db9829ede7e6e217de6ac12c2b475b7fc'
$CandidateId = '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
$ReleaseId = 367637128
$ReleaseTag = "runtime-artifact-$CandidateId"
$ReleaseTarget = 'df3f73c789e6d2abf71cbcd75186118d2bbc795a'
$ArchiveName = "libreoffice-wasm-runtime-$CandidateId.zip"
$ArchiveSha256 = 'e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a'
$FixtureSha256 = 'a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df'
$NativeCommit = '71d33678ed74872ebbb1bc37f5778143f8f5e401'
$NativeRunId = 31211473147
$NativeCreatedAt = '2026-08-07T19:26:24Z'
$LatestNativeRunId = 31802763221
$LatestNativeHeadSha = '488554990ffd2f4242ccb8cec92a9c8e976faf16'
$LatestNativeCreatedAt = '2026-08-14T13:00:24Z'
$Records = [Collections.Generic.List[object]]::new()

function Assert-Condition {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

function ConvertTo-PreparationUtcInstant {
  param([Parameter(Mandatory = $true)][object]$Value, [Parameter(Mandatory = $true)][string]$Name)
  if ($Value -is [DateTimeOffset]) { return ([DateTimeOffset]$Value).ToUniversalTime() }
  if ($Value -is [DateTime]) {
    $dateTime = [DateTime]$Value
    if ($dateTime.Kind -eq [DateTimeKind]::Unspecified) { throw "$Name has no UTC offset." }
    return [DateTimeOffset]::new($dateTime).ToUniversalTime()
  }
  if ($Value -is [string]) {
    $text = ([string]$Value).Trim()
    if ($text -notmatch '(?:[zZ]|[+-][0-9]{2}:[0-9]{2})$') { throw "$Name has no UTC offset." }
    $parsed = [DateTimeOffset]::MinValue
    $styles = [Globalization.DateTimeStyles]::AllowWhiteSpaces -bor [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal
    if (-not [DateTimeOffset]::TryParse($text, [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$parsed)) {
      throw "$Name is not a valid ISO-8601 timestamp."
    }
    return $parsed.ToUniversalTime()
  }
  throw "$Name has unsupported timestamp type $($Value.GetType().FullName)."
}

function Assert-SamePreparationUtcInstant {
  param([Parameter(Mandatory = $true)][object]$Actual, [Parameter(Mandatory = $true)][object]$Expected, [Parameter(Mandatory = $true)][string]$Message)
  $actualInstant = ConvertTo-PreparationUtcInstant -Value $Actual -Name 'Actual timestamp'
  $expectedInstant = ConvertTo-PreparationUtcInstant -Value $Expected -Name 'Expected timestamp'
  if ($actualInstant.UtcDateTime.Ticks -ne $expectedInstant.UtcDateTime.Ticks) { throw $Message }
}

function Remove-PreparationPath {
  param([Parameter(Mandatory = $true)][string]$Path)
  $fullPath = [IO.Path]::GetFullPath($Path)
  $rootPrefix = $PreparationRoot.TrimEnd('\') + '\'
  if (-not $fullPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing removal outside preparation root: $fullPath"
  }
  if (Test-Path -LiteralPath $fullPath) { Remove-Item -LiteralPath $fullPath -Recurse -Force }
}

function Invoke-PreparationCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [int]$TimeoutSeconds = 900,
    [string[]]$ResetPaths = @()
  )
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    foreach ($resetPath in $ResetPaths) { Remove-PreparationPath -Path $resetPath }
    New-Item -ItemType Directory -Force -Path $WorkingDirectory, $Logs | Out-Null
    $stdoutPath = Join-Path $Logs ("{0}.attempt-{1}.stdout.log" -f $Name, $attempt)
    $stderrPath = Join-Path $Logs ("{0}.attempt-{1}.stderr.log" -f $Name, $attempt)
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
    [IO.File]::WriteAllText($stdoutPath, $stdout)
    [IO.File]::WriteAllText($stderrPath, $stderr)
    $exitCode = if ($timedOut) { $null } else { $process.ExitCode }
    $passed = (-not $timedOut -and $exitCode -eq 0)
    $record = [ordered]@{
      name = $Name; attempt = $attempt; classification = 'preparation'
      evidenceStatus = 'not acceptance evidence'; retryPermitted = $true
      startedAt = $startedAt.ToString('o'); completedAt = (Get-Date).ToUniversalTime().ToString('o')
      timeoutSeconds = $TimeoutSeconds; timedOut = $timedOut; exitCode = $exitCode; passed = $passed
      executable = $Executable; arguments = $Arguments; workingDirectory = $WorkingDirectory
      launch = $launch; stdout = $stdoutPath; stderr = $stderrPath
    }
    $Records.Add($record)
    if ($passed) { return [ordered]@{ stdout = $stdout; stderr = $stderr; record = $record } }
    if ($attempt -lt $MaxAttempts) { Start-Sleep -Seconds ([Math]::Min(20, 2 * $attempt)) }
  }
  throw "Preparation command failed after $MaxAttempts attempts: $Name"
}

if (Test-Path -LiteralPath $PreparationRoot -PathType Leaf) { throw 'Preparation root is a file.' }
New-Item -ItemType Directory -Force -Path $PreparationRoot, $Logs, (Split-Path $LocalFixture -Parent), $BrowserRoot | Out-Null
Assert-Condition (Test-Path -LiteralPath $PinnedDocxFixture -PathType Leaf) 'Pinned DOCX fixture missing.'
Assert-Condition ((Get-FileHash -Algorithm SHA256 -LiteralPath $PinnedDocxFixture).Hash.ToLowerInvariant() -eq $FixtureSha256) 'Pinned DOCX hash mismatch.'
Copy-Item -LiteralPath $PinnedDocxFixture -Destination $LocalFixture -Force
$env:PLAYWRIGHT_BROWSERS_PATH = $BrowserRoot
$env:GIT_TERMINAL_PROMPT = '0'
$env:CI = '1'
$env:PLAYWRIGHT_HTML_OPEN = 'never'

Invoke-PreparationCommand -Name 'clone-runtime' -Executable 'git' -Arguments @('clone', '--no-checkout', 'https://github.com/killbus/libreoffice-wasm-conversion-runtime.git', $Runtime) -WorkingDirectory $PreparationRoot -TimeoutSeconds 900 -ResetPaths @($Runtime) | Out-Null
Invoke-PreparationCommand -Name 'checkout-runtime' -Executable 'git' -Arguments @('checkout', '--detach', $RuntimeCommit) -WorkingDirectory $Runtime -TimeoutSeconds 300 | Out-Null
$runtimeRefs = Invoke-PreparationCommand -Name 'runtime-ls-remote' -Executable 'git' -Arguments @('ls-remote', 'origin', 'refs/heads/main') -WorkingDirectory $Runtime -TimeoutSeconds 180
Assert-Condition ($runtimeRefs.stdout -match "(?m)^$RuntimeCommit\s+refs/heads/main$") 'Runtime origin/main mismatch.'
Invoke-PreparationCommand -Name 'clone-pdfhow' -Executable 'git' -Arguments @('clone', '--no-checkout', 'https://github.com/killbus/pdfhow.com-next.git', $PdfHow) -WorkingDirectory $PreparationRoot -TimeoutSeconds 900 -ResetPaths @($PdfHow) | Out-Null
Invoke-PreparationCommand -Name 'checkout-pdfhow' -Executable 'git' -Arguments @('checkout', '--detach', $PdfHowCommit) -WorkingDirectory $PdfHow -TimeoutSeconds 300 | Out-Null
$pdfHowRefs = Invoke-PreparationCommand -Name 'pdfhow-ls-remote' -Executable 'git' -Arguments @('ls-remote', 'origin', 'refs/heads/main') -WorkingDirectory $PdfHow -TimeoutSeconds 180
Assert-Condition ($pdfHowRefs.stdout -match "(?m)^$PdfHowCommit\s+refs/heads/main$") 'PDFHow origin/main mismatch.'

$workflowQuery = Invoke-PreparationCommand -Name 'github-native-workflow-query' -Executable 'gh' -Arguments @('api', 'repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1') -WorkingDirectory $PreparationRoot -TimeoutSeconds 180
$latestWorkflow = @(($workflowQuery.stdout | ConvertFrom-Json).workflow_runs)[0]
Assert-Condition ([int64]$latestWorkflow.id -eq $LatestNativeRunId) 'New native/WASM run exists.'
Assert-Condition ($latestWorkflow.head_sha -eq $LatestNativeHeadSha) 'Latest native workflow head changed.'
Assert-SamePreparationUtcInstant -Actual $latestWorkflow.created_at -Expected $LatestNativeCreatedAt -Message 'Latest native workflow timestamp changed.'
Assert-Condition ($latestWorkflow.conclusion -eq 'success') 'Frozen native workflow failed.'

Invoke-PreparationCommand -Name 'release-query-download' -Executable 'node' -Arguments @((Join-Path $PSScriptRoot 'attempt-8-download-assets.mjs'), $Download) -WorkingDirectory $PSScriptRoot -TimeoutSeconds 1200 -ResetPaths @($Download) | Out-Null
Invoke-PreparationCommand -Name 'verify-extract-release' -Executable 'node' -Arguments @('scripts/release-runtime/verify.mjs', '--archive', (Join-Path $Download $ArchiveName), '--extract-root', $Extract, '--report-out', $ArchiveVerification, '--spec', 'scripts/release-runtime/candidate-spec.json', '--expected-candidate-id', $CandidateId) -WorkingDirectory $Runtime -TimeoutSeconds 1200 -ResetPaths @($Extract, $ArchiveVerification) | Out-Null
Invoke-PreparationCommand -Name 'pdfhow-preparation-helper-contract' -Executable 'node' -Arguments @((Join-Path $PSScriptRoot 'attempt-8-prepare-candidate.tests.mjs'), '--pdfhow-repository', $PdfHow, '--work-root', $ContractWork, '--report-out', $ContractReport) -WorkingDirectory $PSScriptRoot -TimeoutSeconds 600 -ResetPaths @($ContractWork, $ContractReport) | Out-Null
Invoke-PreparationCommand -Name 'prepare-pdfhow-local-candidate' -Executable 'node' -Arguments @('scripts/prepare-libreoffice-runtime-candidate.mjs', '--native-root', (Join-Path $Extract 'wasm'), '--wrapper-root', $Extract, '--destination', $Prepared, '--native-commit', $NativeCommit, '--wrapper-commit', $ReleaseTarget, '--github-actions-run-id', ([string]$NativeRunId), '--native-abi', 'lok-convert-document-v1', '--native-schema-version', '1', '--pthread-worker-mode', 'main-script') -WorkingDirectory $PdfHow -TimeoutSeconds 1200 -ResetPaths @($Prepared) | Out-Null
Invoke-PreparationCommand -Name 'verify-prepared-candidate' -Executable 'node' -Arguments @((Join-Path $PSScriptRoot 'attempt-8-verify-prepared-candidate.mjs'), '--candidate-root', $Prepared, '--expected-candidate-id', $CandidateId, '--expected-native-root', (Join-Path $Extract 'wasm'), '--expected-wrapper-root', $Extract, '--expected-native-commit', $NativeCommit, '--expected-wrapper-commit', $ReleaseTarget, '--expected-run-id', ([string]$NativeRunId), '--expected-abi', 'lok-convert-document-v1', '--expected-native-schema-version', '1', '--expected-pthread-worker-mode', 'main-script') -WorkingDirectory $PSScriptRoot -TimeoutSeconds 600 | Out-Null
Invoke-PreparationCommand -Name 'runtime-dependency-install' -Executable 'pnpm' -Arguments @('install', '--frozen-lockfile', '--ignore-scripts') -WorkingDirectory $Runtime -TimeoutSeconds 1200 | Out-Null
Invoke-PreparationCommand -Name 'runtime-wrapper-build' -Executable 'pnpm' -Arguments @('build') -WorkingDirectory $Runtime -TimeoutSeconds 900 | Out-Null
Invoke-PreparationCommand -Name 'runtime-static-contract-gates' -Executable 'pnpm' -Arguments @('exec', 'vitest', 'run', 'tests/release-runtime/workflow-guard.test.ts', 'tests/release-runtime/cli-contract.test.ts', '--reporter=verbose') -WorkingDirectory $Runtime -TimeoutSeconds 600 | Out-Null
Invoke-PreparationCommand -Name 'pdfhow-dependency-install' -Executable 'pnpm' -Arguments @('install', '--frozen-lockfile', '--ignore-scripts') -WorkingDirectory $PdfHow -TimeoutSeconds 1800 | Out-Null
Invoke-PreparationCommand -Name 'chromium-install' -Executable 'pnpm' -Arguments @('exec', 'playwright', 'install', 'chromium') -WorkingDirectory $PdfHow -TimeoutSeconds 1800 | Out-Null

$fixedInputs = [ordered]@{
  runtimeCommit = $RuntimeCommit; pdfHowCommit = $PdfHowCommit; candidateId = $CandidateId
  releaseId = $ReleaseId; releaseTag = $ReleaseTag; releaseTarget = $ReleaseTarget
  archiveName = $ArchiveName; archiveSha256 = $ArchiveSha256; pinnedDocxSha256 = $FixtureSha256
  nativeCommit = $NativeCommit; nativeWorkflowRunId = $NativeRunId; nativeWorkflowCreatedAt = $NativeCreatedAt
  latestNativeWorkflowRunId = $LatestNativeRunId; latestNativeWorkflowHeadSha = $LatestNativeHeadSha; latestNativeWorkflowCreatedAt = $LatestNativeCreatedAt
}
$manifest = [ordered]@{
  schemaVersion = 1; kind = 'acceptance-attempt-8-preparation-manifest'; attemptNumber = 8
  phase = 'preparation'; classification = 'preparation'; evidenceStatus = 'not acceptance evidence'
  retryPermitted = $true; status = 'passed'; generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  formalAttemptStarted = $false; formalInvocationCount = 0; acceptanceDecision = $null
  preparationRoot = $PreparationRoot; localPinnedFixture = $LocalFixture; fixedInputs = $fixedInputs
  remoteObservations = [ordered]@{
    runtimeRefs = $runtimeRefs.stdout.Trim(); pdfHowRefs = $pdfHowRefs.stdout.Trim()
    nativeWorkflowRunId = [int64]$latestWorkflow.id
  }
  commands = $Records
}
$manifestPath = Join-Path $PreparationRoot 'attempt-8-preparation-manifest.json'
[IO.File]::WriteAllText($manifestPath, (($manifest | ConvertTo-Json -Depth 20) + "`n"), [Text.UTF8Encoding]::new($false))
Invoke-PreparationCommand -Name 'seal-local-inputs' -Executable 'node' -Arguments @((Join-Path $PSScriptRoot 'attempt-8-sealed-inputs.mjs'), 'seal', $PreparationRoot, $LocalFixture, (Join-Path $PreparationRoot 'attempt-8-sealed-inputs.json')) -WorkingDirectory $PSScriptRoot -TimeoutSeconds 7200 | Out-Null
Write-Output "Attempt 8 preparation passed; not acceptance evidence; formal invocation count 0; root $PreparationRoot"
