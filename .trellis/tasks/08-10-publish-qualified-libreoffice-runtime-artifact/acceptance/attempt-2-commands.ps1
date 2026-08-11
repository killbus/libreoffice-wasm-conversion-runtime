[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PinnedDocxFixture,
  [string]$AcceptanceRoot = 'D:\tmp\lo-runtime-acceptance-attempt-2'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$PSNativeCommandUseErrorActionPreference = $false

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw 'Acceptance Attempt 2 requires PowerShell 7 or later (pwsh).'
}

# This is a single-pass, retry-free, fail-closed acceptance command file.
# TEAM B must not execute it. The independent acceptance owner runs it once.
# If any command fails or times out, execution stops immediately. Failed or
# missing samples must not be rerun, replaced, backfilled, or supplemented.
$RuntimeCommit = 'a1c3cd6d6d2dd25fab063539e9fe40fbb327b846'
$PdfHowCommit = 'b41fde5db9829ede7e6e217de6ac12c2b475b7fc'
$CandidateId = '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
$ReleaseId = 367637128
$ReleaseTag = "runtime-artifact-$CandidateId"
$ReleaseTarget = 'df3f73c789e6d2abf71cbcd75186118d2bbc795a'
$ArchiveName = "libreoffice-wasm-runtime-$CandidateId.zip"
$ArchiveSha256 = 'e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a'
$PinnedDocxSha256 = 'a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df'
$NativeCommit = '71d33678ed74872ebbb1bc37f5778143f8f5e401'
$NativeWorkflowRunId = 31211473147
$NativeWorkflowCreatedAt = '2026-08-07T19:26:24Z'
$RuntimeRepositoryUrl = 'https://github.com/killbus/libreoffice-wasm-conversion-runtime.git'
$PdfHowRepositoryUrl = 'https://github.com/killbus/pdfhow.com-next.git'
$RuntimeRepository = Join-Path $AcceptanceRoot 'runtime-repository'
$PdfHowRepository = Join-Path $AcceptanceRoot 'pdfhow-repository'
$EvidenceRoot = Join-Path $AcceptanceRoot 'evidence'
$DownloadRoot = Join-Path $AcceptanceRoot 'release-download'
$ExtractRoot = Join-Path $AcceptanceRoot 'verified-extract'
$NodeWork = Join-Path $EvidenceRoot 'node-gate-work'
$PinnedDocxFixture = [IO.Path]::GetFullPath($PinnedDocxFixture)
$AcceptanceRoot = [IO.Path]::GetFullPath($AcceptanceRoot)
$CommandIndex = 0

$ExpectedReleaseAssets = @(
  [ordered]@{ id = 508126612; name = 'ASSET-SHA256SUMS'; bytes = 677; sha256 = '83bb7bb697dcf4b8feb59934ad928aa22b8d87c18104ebeed451a3eb7aff9c32' },
  [ordered]@{ id = 508126611; name = 'CANDIDATE-MANIFEST.json'; bytes = 2365; sha256 = 'c33b76b49346b08d0cdcbf1ce64db3025f9ceacd29113664279c56e0dae8dab0' },
  [ordered]@{ id = 508126614; name = $ArchiveName; bytes = 248934231; sha256 = $ArchiveSha256 },
  [ordered]@{ id = 508126610; name = 'SHA256SUMS'; bytes = 333; sha256 = 'df1e89e0364660c75d00fcaa4cf77fbd80176986812a8009e9a3e176e9bc9dac' },
  [ordered]@{ id = 508140311; name = 'STAGING-REPORT.json'; bytes = 4571; sha256 = '2094842f73c67cd31481741480a27646607f4a18eda3337bf5dfaebc714c7cc6' }
)
$ExpectedRuntimeFiles = @(
  'dist/browser.d.ts',
  'dist/browser.js',
  'dist/browser.worker.global.js',
  'wasm/loader.cjs',
  'wasm/soffice.cjs',
  'wasm/soffice.data',
  'wasm/soffice.js',
  'wasm/soffice.wasm'
)
$ExpectedArchiveFiles = @($ExpectedRuntimeFiles + 'ASSET-SHA256SUMS' + 'CANDIDATE-MANIFEST.json') | Sort-Object
$EvidenceEnvironmentNames = @(
  'CI',
  'PLAYWRIGHT_WORKERS',
  'PLAYWRIGHT_HTML_OPEN',
  'OFFICE_BROWSER_DOCX_FIXTURE',
  'OFFICE_RUNTIME_ROOT',
  'ACCEPTANCE_RETRY_POLICY',
  'GIT_TERMINAL_PROMPT',
  'npm_config_fetch_retries',
  'npm_config_fetch_retry_maxtimeout',
  'npm_config_fetch_retry_mintimeout'
)

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Write-JsonEvidence([string]$Path, [object]$Value) {
  $json = $Value | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($Path, "$json`n", [Text.UTF8Encoding]::new($false))
}

function Resolve-Application([string]$Name) {
  $command = Get-Command $Name -CommandType Application -ErrorAction Stop | Select-Object -First 1
  return $command.Source
}

function ConvertTo-CmdToken([string]$Value) {
  if ($Value.Contains('"')) { throw "Unsupported quote in cmd.exe argument: $Value" }
  return '"' + $Value.Replace('%', '%%') + '"'
}

function Invoke-FailClosedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds,
    [int]$ExpectedExitCode = 0
  )

  $script:CommandIndex += 1
  $safeName = ($Name -replace '[^A-Za-z0-9_.-]', '-')
  $prefix = '{0:D2}-{1}' -f $script:CommandIndex, $safeName
  $stdoutPath = Join-Path $EvidenceRoot "$prefix.stdout.log"
  $stderrPath = Join-Path $EvidenceRoot "$prefix.stderr.log"
  $metadataPath = Join-Path $EvidenceRoot "$prefix.command.json"
  $resolvedExecutable = Resolve-Application $Executable
  $environment = [ordered]@{}
  foreach ($environmentName in $EvidenceEnvironmentNames) {
    $environment[$environmentName] = [Environment]::GetEnvironmentVariable($environmentName)
  }
  if ($env:OFFICE_COLD_START_SAMPLE) {
    $environment['OFFICE_COLD_START_SAMPLE'] = $env:OFFICE_COLD_START_SAMPLE
  }
  Write-JsonEvidence $metadataPath ([ordered]@{
    name = $Name
    executable = $resolvedExecutable
    arguments = $Arguments
    workingDirectory = $WorkingDirectory
    timeoutSeconds = $TimeoutSeconds
    retry = 'disabled; command is invoked once only'
    expectedExitCode = $ExpectedExitCode
    stdout = $stdoutPath
    stderr = $stderrPath
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    environment = $environment
  })

  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  if ($resolvedExecutable -match '\.(cmd|bat)$') {
    $startInfo.FileName = $env:ComSpec
    [void]$startInfo.ArgumentList.Add('/d')
    [void]$startInfo.ArgumentList.Add('/s')
    [void]$startInfo.ArgumentList.Add('/c')
    $cmdTokens = @((ConvertTo-CmdToken $resolvedExecutable)) + @($Arguments | ForEach-Object { ConvertTo-CmdToken $_ })
    [void]$startInfo.ArgumentList.Add('"' + ($cmdTokens -join ' ') + '"')
  } else {
    $startInfo.FileName = $resolvedExecutable
    foreach ($argument in $Arguments) { [void]$startInfo.ArgumentList.Add($argument) }
  }

  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  if (-not $process.Start()) { throw "Failed to start command: $Name" }
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
    try { $process.Kill($true) } catch { }
    $process.WaitForExit()
    [IO.File]::WriteAllText($stdoutPath, $stdoutTask.GetAwaiter().GetResult(), [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText($stderrPath, $stderrTask.GetAwaiter().GetResult(), [Text.UTF8Encoding]::new($false))
    throw "TIMEOUT after $TimeoutSeconds seconds: $Name. Stop immediately; no retry or backfill is permitted."
  }
  $stdout = $stdoutTask.GetAwaiter().GetResult()
  $stderr = $stderrTask.GetAwaiter().GetResult()
  [IO.File]::WriteAllText($stdoutPath, $stdout, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($stderrPath, $stderr, [Text.UTF8Encoding]::new($false))
  if ($process.ExitCode -ne $ExpectedExitCode) {
    throw "Unexpected exit code $($process.ExitCode), expected ${ExpectedExitCode}: $Name. Stop immediately; no retry or backfill is permitted."
  }
  return [ordered]@{ stdoutPath = $stdoutPath; stderrPath = $stderrPath; metadataPath = $metadataPath; stdout = $stdout; exitCode = $process.ExitCode }
}

if (Test-Path -LiteralPath $AcceptanceRoot) {
  throw "Acceptance root must not already exist: $AcceptanceRoot"
}
if (-not (Test-Path -LiteralPath $PinnedDocxFixture -PathType Leaf)) {
  throw "Pinned DOCX fixture is missing: $PinnedDocxFixture"
}
$fixtureHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $PinnedDocxFixture).Hash.ToLowerInvariant()
Assert-True ($fixtureHash -eq $PinnedDocxSha256) "Pinned DOCX fixture SHA-256 mismatch: $fixtureHash"
New-Item -ItemType Directory -Path $AcceptanceRoot, $EvidenceRoot -ErrorAction Stop | Out-Null

$env:CI = '1'
$env:PLAYWRIGHT_WORKERS = '1'
$env:PLAYWRIGHT_HTML_OPEN = 'never'
$env:OFFICE_BROWSER_DOCX_FIXTURE = $PinnedDocxFixture
$env:OFFICE_RUNTIME_ROOT = $ExtractRoot
$env:ACCEPTANCE_RETRY_POLICY = 'disabled'
$env:GIT_TERMINAL_PROMPT = '0'
$env:npm_config_fetch_retries = '0'
$env:npm_config_fetch_retry_maxtimeout = '0'
$env:npm_config_fetch_retry_mintimeout = '0'

Write-JsonEvidence (Join-Path $EvidenceRoot '00-fixed-inputs.json') ([ordered]@{
  acceptanceAttempt = 2
  acceptanceOwner = 'OpenAI Codex AI 编程代理（当前验收会话实例）'
  runtimeCheckout = $RuntimeCommit
  pdfHowCheckout = $PdfHowCommit
  candidateId = $CandidateId
  releaseId = $ReleaseId
  releaseTag = $ReleaseTag
  releaseTarget = $ReleaseTarget
  releaseDraftRequired = $true
  releaseQualifiedRequired = $false
  archiveSha256 = $ArchiveSha256
  fixture = $PinnedDocxFixture
  fixtureSha256 = $fixtureHash
  retries = 'disabled'
  failClosed = $true
})

# Fresh, detached, pinned repository checkouts. These paths are not TEAM B staging,
# an old extraction, a local overlay, or an Attempt 1 download directory.
Invoke-FailClosedCommand 'clone-runtime' 'git' @('clone', '--no-checkout', $RuntimeRepositoryUrl, $RuntimeRepository) $AcceptanceRoot 300 | Out-Null
Invoke-FailClosedCommand 'checkout-runtime' 'git' @('checkout', '--detach', $RuntimeCommit) $RuntimeRepository 60 | Out-Null
$runtimeHead = Invoke-FailClosedCommand 'verify-runtime-head' 'git' @('rev-parse', 'HEAD') $RuntimeRepository 30
Assert-True ($runtimeHead.stdout.Trim() -eq $RuntimeCommit) 'Runtime detached checkout differs from the fixed remediation commit.'
$runtimeRemoteRefs = Invoke-FailClosedCommand 'verify-runtime-remote-refs' 'git' @('ls-remote', 'origin', 'refs/heads/main', 'refs/heads/feat/publish-qualified-libreoffice-runtime-artifact') $RuntimeRepository 60
Assert-True ($runtimeRemoteRefs.stdout -match "(?m)^$RuntimeCommit\s+refs/heads/main$") 'Runtime remediation commit is not at origin/main.'
Assert-True ($runtimeRemoteRefs.stdout -match '(?m)^[0-9a-f]{40}\s+refs/heads/feat/publish-qualified-libreoffice-runtime-artifact$') 'Recorded runtime feature branch is missing.'
Invoke-FailClosedCommand 'verify-runtime-remediation-contained-in-feature-branch' 'git' @('merge-base', '--is-ancestor', $RuntimeCommit, 'origin/feat/publish-qualified-libreoffice-runtime-artifact') $RuntimeRepository 30 | Out-Null

Invoke-FailClosedCommand 'clone-pdfhow' 'git' @('clone', '--no-checkout', $PdfHowRepositoryUrl, $PdfHowRepository) $AcceptanceRoot 300 | Out-Null
Invoke-FailClosedCommand 'checkout-pdfhow' 'git' @('checkout', '--detach', $PdfHowCommit) $PdfHowRepository 60 | Out-Null
$pdfHowHead = Invoke-FailClosedCommand 'verify-pdfhow-head' 'git' @('rev-parse', 'HEAD') $PdfHowRepository 30
Assert-True ($pdfHowHead.stdout.Trim() -eq $PdfHowCommit) 'PDFHow detached checkout differs from the fixed remediation commit.'
$pdfHowRemoteRefs = Invoke-FailClosedCommand 'verify-pdfhow-remote-refs' 'git' @('ls-remote', 'origin', 'refs/heads/main') $PdfHowRepository 60
Assert-True ($pdfHowRemoteRefs.stdout -match "(?m)^$PdfHowCommit\s+refs/heads/main$") 'PDFHow remediation commit is not at origin/main.'

# Preflight the frozen native/WASM build boundary before downloading assets or
# starting any acceptance gate. A later identical check proves it stayed fixed.
$preflightWorkflowCheck = Invoke-FailClosedCommand 'preflight-no-new-native-wasm-build' 'gh' @(
  'api',
  'repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1'
) $AcceptanceRoot 60
$preflightWorkflowPayload = $preflightWorkflowCheck.stdout | ConvertFrom-Json
$preflightLatestWorkflowRun = @($preflightWorkflowPayload.workflow_runs)[0]
Assert-True ([int64]$preflightLatestWorkflowRun.id -eq $NativeWorkflowRunId) 'Preflight found a newer Build WASM run.'
Assert-True ($preflightLatestWorkflowRun.created_at -eq $NativeWorkflowCreatedAt) 'Preflight Build WASM creation time changed.'
Assert-True ($preflightLatestWorkflowRun.head_sha -eq $NativeCommit) 'Preflight Build WASM head SHA changed.'
Assert-True ($preflightLatestWorkflowRun.conclusion -eq 'success') 'Preflight frozen Build WASM run is not successful.'
Write-JsonEvidence (Join-Path $EvidenceRoot 'preflight-native-workflow-assertions.json') ([ordered]@{
  passed = $true
  workflowId = 325462492
  latestRunId = [int64]$preflightLatestWorkflowRun.id
  createdAt = $preflightLatestWorkflowRun.created_at
  headSha = $preflightLatestWorkflowRun.head_sha
  conclusion = $preflightLatestWorkflowRun.conclusion
  noNewNativeWasmBuildSinceFrozenCandidate = $true
})

# Release identity/state check plus a fresh GitHub download of every asset.
$downloadHelper = Join-Path $PSScriptRoot 'attempt-2-download-assets.mjs'
Assert-True (Test-Path -LiteralPath $downloadHelper -PathType Leaf) "Download helper missing: $downloadHelper"
Invoke-FailClosedCommand 'release-identity-and-download-all-assets' 'node' @($downloadHelper, $DownloadRoot) $PSScriptRoot 900 | Out-Null

# Fail-closed central-directory safety, extraction, exact inventory, byte hashes,
# candidate identity, provenance, ABI/schema, pthread mode, and worker absence.
$archivePath = Join-Path $DownloadRoot $ArchiveName
$verificationReportPath = Join-Path $EvidenceRoot 'archive-verification-report.json'
Invoke-FailClosedCommand 'verify-and-extract-release-archive' 'node' @(
  'scripts/release-runtime/verify.mjs',
  '--archive', $archivePath,
  '--extract-root', $ExtractRoot,
  '--report-out', $verificationReportPath,
  '--spec', 'scripts/release-runtime/candidate-spec.json',
  '--expected-candidate-id', $CandidateId
) $RuntimeRepository 900 | Out-Null

$verification = Get-Content -Raw -LiteralPath $verificationReportPath | ConvertFrom-Json
$manifest = Get-Content -Raw -LiteralPath (Join-Path $ExtractRoot 'CANDIDATE-MANIFEST.json') | ConvertFrom-Json
$actualArchiveFiles = @(Get-ChildItem -LiteralPath $ExtractRoot -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath($ExtractRoot, $_.FullName).Replace('\', '/')
} | Sort-Object)
Assert-True (($actualArchiveFiles -join "`n") -eq ($ExpectedArchiveFiles -join "`n")) 'Archive inventory is not exactly eight runtime files plus two control files.'
Assert-True (@($verification.runtimeAssets).Count -eq 8) 'Verification report does not contain exactly eight runtime assets.'
$actualRuntimePaths = @($verification.runtimeAssets.path | Sort-Object)
$expectedRuntimePaths = @($ExpectedRuntimeFiles | Sort-Object)
Assert-True (($actualRuntimePaths -join "`n") -eq ($expectedRuntimePaths -join "`n")) 'Eight-file runtime inventory differs from the frozen inventory.'
foreach ($file in Get-ChildItem -LiteralPath $ExtractRoot -File -Recurse) {
  $resolvedFile = [IO.Path]::GetFullPath($file.FullName)
  $resolvedRoot = [IO.Path]::GetFullPath($ExtractRoot).TrimEnd('\') + '\'
  Assert-True ($resolvedFile.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase)) "Extracted path escaped the fresh extraction root: $resolvedFile"
}
Assert-True (-not ($actualArchiveFiles | Where-Object { $_ -match '(^|/)soffice\.worker\.js$' })) 'Forbidden soffice.worker.js exists.'
Assert-True ($verification.candidateId -eq $CandidateId) 'Candidate ID mismatch.'
Assert-True ($verification.archiveSha256 -eq $ArchiveSha256) 'Archive SHA-256 mismatch.'
Assert-True ($verification.abi -eq 'lok-convert-document-v1') 'ABI mismatch.'
Assert-True ([int]$verification.schemaVersion -eq 1) 'Schema version mismatch.'
Assert-True ($verification.pthreadWorkerMode -eq 'main-script') 'pthread mode is not main-script.'
Assert-True ($null -eq $verification.externalWorker) 'externalWorker must be null.'
Assert-True ($verification.evidence.provenance.native.commit -eq $NativeCommit) 'Native provenance commit mismatch.'
Assert-True ([string]$verification.evidence.provenance.native.githubActionsRunId -eq [string]$NativeWorkflowRunId) 'Native workflow run provenance mismatch.'
Assert-True ($verification.evidence.provenance.wrapper.commit -eq $ReleaseTarget) 'Wrapper provenance commit mismatch.'
Assert-True ($manifest.releaseQualified -eq $false) 'Extracted candidate manifest must remain releaseQualified: false.'
Write-JsonEvidence (Join-Path $EvidenceRoot 'archive-assertions.json') ([ordered]@{
  passed = $true
  centralDirectoryAndExtractionSafety = 'verified by verify.mjs before extraction and by extraction-root containment assertion'
  exactRuntimeInventory = $ExpectedRuntimeFiles
  exactArchiveInventory = $ExpectedArchiveFiles
  candidateId = $CandidateId
  archiveSha256 = $ArchiveSha256
  provenance = $verification.evidence.provenance
  abi = $verification.abi
  schemaVersion = $verification.schemaVersion
  pthreadWorkerMode = $verification.pthreadWorkerMode
  externalWorker = $verification.externalWorker
  forbiddenWorkerAbsent = $true
  releaseQualified = $false
})

# Dependency setup and wrapper compilation do not invoke a native/WASM build.
Invoke-FailClosedCommand 'runtime-install' 'pnpm' @('install', '--frozen-lockfile', '--ignore-scripts') $RuntimeRepository 600 | Out-Null
Invoke-FailClosedCommand 'runtime-wrapper-build-not-native-wasm' 'pnpm' @('build') $RuntimeRepository 600 | Out-Null

# Runtime workflow guard and verifier/stage CLI contract gates.
Invoke-FailClosedCommand 'runtime-workflow-and-cli-contract-gates' 'pnpm' @(
  'exec', 'vitest', 'run',
  'tests/release-runtime/workflow-guard.test.ts',
  'tests/release-runtime/cli-contract.test.ts',
  '--reporter=verbose'
) $RuntimeRepository 300 | Out-Null
Invoke-FailClosedCommand 'verifier-cli-help-contract' 'node' @('scripts/release-runtime/verify.mjs', '--help') $RuntimeRepository 30 | Out-Null
Invoke-FailClosedCommand 'stage-cli-help-contract' 'node' @('scripts/release-runtime/stage-draft.mjs', '--help') $RuntimeRepository 30 | Out-Null

# Node positive, negative, reuse, recovery, ABI, and cleanup gate.
Invoke-FailClosedCommand 'node-positive-negative-reuse-recovery-abi-cleanup' 'node' @(
  'scripts/release-runtime/node-smoke-gate.cjs',
  '--extract', (Join-Path $ExtractRoot 'wasm'),
  '--input', $PinnedDocxFixture,
  '--work', $NodeWork
) $RuntimeRepository 900 | Out-Null
$nodeResultPath = Join-Path $NodeWork 'node-smoke-result.json'
$nodeResult = Get-Content -Raw -LiteralPath $nodeResultPath | ConvertFrom-Json
$nodePhaseNames = @($nodeResult.phases.phase)
foreach ($requiredPhase in @('positive', 'reuse', 'negative', 'recovery', 'abi-exports', 'cleanup')) {
  Assert-True ($nodePhaseNames -contains $requiredPhase) "Node gate is missing phase: $requiredPhase"
}
$cleanup = @($nodeResult.phases | Where-Object phase -eq 'cleanup')[-1]
Assert-True ($nodeResult.status -eq 'passed') 'Node gate status is not passed.'
Assert-True ($cleanup.destroyed -eq $true) 'Node cleanup destroyed is not true.'
Assert-True ($cleanup.moduleReleased -eq $true) 'Node cleanup moduleReleased is not true.'
Assert-True ($cleanup.initializedFalse -eq $true) 'Node cleanup initializedFalse is not true.'
Write-JsonEvidence (Join-Path $EvidenceRoot 'node-gate-assertions.json') ([ordered]@{
  passed = $true
  status = $nodeResult.status
  requiredPhases = @('positive', 'reuse', 'negative', 'recovery', 'abi-exports', 'cleanup')
  cleanup = $cleanup
})

# PDFHow dependency setup and Chromium availability. No native/WASM build is run.
Invoke-FailClosedCommand 'pdfhow-install' 'pnpm' @('install', '--frozen-lockfile', '--ignore-scripts') $PdfHowRepository 900 | Out-Null
Invoke-FailClosedCommand 'playwright-install-chromium' 'pnpm' @('exec', 'playwright', 'install', 'chromium') $PdfHowRepository 900 | Out-Null

# Complete retry-free Chromium candidate gate. The named PDFHow test asserts
# conversion, cancellation progress, normal recovery, dispose, and teardown.
$fullGateOutput = Join-Path $EvidenceRoot 'pdfhow-full-gate-output'
Invoke-FailClosedCommand 'pdfhow-full-retry-free-chromium-candidate-gate' 'pnpm' @(
  'exec', 'playwright', 'test',
  'tests/office-conversion/office-browser.playwright.ts',
  '--config=playwright.config.ts',
  '--reporter=line',
  '--workers=1',
  '--retries=0',
  '--repeat-each=1',
  '--trace=retain-on-failure',
  "--output=$fullGateOutput"
) $PdfHowRepository 900 | Out-Null

# Five independent fresh Playwright CLI/browser processes. This formal loop is
# sequential and fail-closed: Run throws on the first failure/timeout, so later
# samples are not started and no failed sample may be rerun or backfilled.
$coldStartResults = @()
for ($sample = 1; $sample -le 5; $sample += 1) {
  $env:OFFICE_COLD_START_SAMPLE = [string]$sample
  $sampleOutput = Join-Path $EvidenceRoot ("pdfhow-cold-start-{0}-output" -f $sample)
  $startedAt = Get-Date
  Invoke-FailClosedCommand ("pdfhow-cold-start-{0}" -f $sample) 'pnpm' @(
    'exec', 'playwright', 'test',
    'tests/office-conversion/office-browser.playwright.ts',
    '--config=playwright.config.ts',
    '--grep=validates conversion, recovery, assets, and teardown in local-candidate mode',
    '--reporter=line',
    '--workers=1',
    '--retries=0',
    '--repeat-each=1',
    '--trace=retain-on-failure',
    "--output=$sampleOutput"
  ) $PdfHowRepository 900 | Out-Null
  $coldStartResults += [ordered]@{
    sample = $sample
    independentPlaywrightProcess = $true
    retries = 0
    exitCode = 0
    durationSeconds = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 3)
    output = $sampleOutput
  }
}
Remove-Item Env:OFFICE_COLD_START_SAMPLE -ErrorAction SilentlyContinue
Write-JsonEvidence (Join-Path $EvidenceRoot 'five-cold-start-summary.json') ([ordered]@{
  passed = $true
  consecutiveSamples = 5
  failedSamplesRerun = $false
  backfillPerformed = $false
  samples = $coldStartResults
})

# Verify that no native/WASM build has run since the frozen candidate.
$workflowCheck = Invoke-FailClosedCommand 'verify-no-new-native-wasm-build' 'gh' @(
  'api',
  'repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1'
) $AcceptanceRoot 60
$workflowPayload = $workflowCheck.stdout | ConvertFrom-Json
$latestWorkflowRun = @($workflowPayload.workflow_runs)[0]
Assert-True ([int64]$latestWorkflowRun.id -eq $NativeWorkflowRunId) 'A different Build WASM run is now latest.'
Assert-True ($latestWorkflowRun.created_at -eq $NativeWorkflowCreatedAt) 'Latest Build WASM creation time changed.'
Assert-True ($latestWorkflowRun.head_sha -eq $NativeCommit) 'Latest Build WASM head SHA changed.'
Assert-True ($latestWorkflowRun.conclusion -eq 'success') 'Frozen Build WASM run is not successful.'
Write-JsonEvidence (Join-Path $EvidenceRoot 'native-workflow-assertions.json') ([ordered]@{
  passed = $true
  workflowId = 325462492
  latestRunId = [int64]$latestWorkflowRun.id
  createdAt = $latestWorkflowRun.created_at
  headSha = $latestWorkflowRun.head_sha
  conclusion = $latestWorkflowRun.conclusion
  noNewNativeWasmBuildSinceFrozenCandidate = $true
})

# Final release check proves that the draft identity and all five assets did not
# change during acceptance. This command does not upload, replace, or edit assets.
$finalReleaseCheck = Invoke-FailClosedCommand 'final-release-and-asset-immutability-check' 'gh' @(
  'api',
  "repos/killbus/libreoffice-wasm-conversion-runtime/releases/$ReleaseId"
) $AcceptanceRoot 60
$finalRelease = $finalReleaseCheck.stdout | ConvertFrom-Json
Assert-True ([int64]$finalRelease.id -eq $ReleaseId) 'Final Release ID changed.'
Assert-True ($finalRelease.tag_name -eq $ReleaseTag) 'Final Release tag changed.'
Assert-True ($finalRelease.target_commitish -eq $ReleaseTarget) 'Final Release target changed.'
Assert-True ($finalRelease.draft -eq $true) 'Release is no longer draft.'
Assert-True ($null -eq $finalRelease.published_at) 'Release has a published_at value.'
Assert-True (@($finalRelease.assets).Count -eq $ExpectedReleaseAssets.Count) 'Release asset count changed.'
foreach ($expectedAsset in $ExpectedReleaseAssets) {
  $actualAsset = @($finalRelease.assets | Where-Object id -eq $expectedAsset.id)
  Assert-True ($actualAsset.Count -eq 1) "Release asset ID missing or duplicated: $($expectedAsset.id)"
  Assert-True ($actualAsset[0].name -eq $expectedAsset.name) "Release asset name changed: $($expectedAsset.name)"
  Assert-True ([int64]$actualAsset[0].size -eq [int64]$expectedAsset.bytes) "Release asset byte size changed: $($expectedAsset.name)"
  Assert-True (($actualAsset[0].digest -replace '^sha256:', '') -eq $expectedAsset.sha256) "Release asset SHA-256 changed: $($expectedAsset.name)"
}
Write-JsonEvidence (Join-Path $EvidenceRoot 'final-release-assertions.json') ([ordered]@{
  passed = $true
  releaseId = [int64]$finalRelease.id
  url = $finalRelease.html_url
  tag = $finalRelease.tag_name
  target = $finalRelease.target_commitish
  draft = $finalRelease.draft
  publishedAt = $finalRelease.published_at
  releaseQualified = $false
  assetMutationPerformed = $false
  assets = $ExpectedReleaseAssets
})

# Hash every persisted evidence file except this inventory itself.
$evidenceInventoryPath = Join-Path $EvidenceRoot 'evidence-sha256.json'
$evidenceInventory = @(Get-ChildItem -LiteralPath $EvidenceRoot -File -Recurse | Where-Object FullName -ne $evidenceInventoryPath | Sort-Object FullName | ForEach-Object {
  [ordered]@{
    path = [IO.Path]::GetRelativePath($EvidenceRoot, $_.FullName).Replace('\', '/')
    bytes = $_.Length
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  }
})
Write-JsonEvidence $evidenceInventoryPath ([ordered]@{
  acceptanceAttempt = 2
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  retryPerformed = $false
  files = $evidenceInventory
})
Write-JsonEvidence (Join-Path $AcceptanceRoot 'ATTEMPT-2-COMMAND-COMPLETED.json') ([ordered]@{
  acceptanceAttempt = 2
  commandCompleted = $true
  passFailDecision = 'not written by this command; independent acceptance owner signs separately'
  completedAt = (Get-Date).ToUniversalTime().ToString('o')
  evidenceRoot = $EvidenceRoot
})

Write-Host "Acceptance Attempt 2 command sequence completed without command failure. Evidence: $EvidenceRoot"
Write-Host 'This command file does not itself issue the independent PASS/FAIL signature.'
