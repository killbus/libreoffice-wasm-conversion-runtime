[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$PreparationRoot,
  [Parameter(Mandatory = $true)][string]$FormalRoot,
  [Parameter(Mandatory = $true)][string]$InvocationControlRoot,
  [Parameter(Mandatory = $true)][string]$AdmissionRecord,
  [Parameter(Mandatory = $true)][string]$ClosureOutputRoot
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$PSNativeCommandUseErrorActionPreference = $false

$PreparationRoot = [IO.Path]::GetFullPath($PreparationRoot)
$FormalRoot = [IO.Path]::GetFullPath($FormalRoot)
$InvocationControlRoot = [IO.Path]::GetFullPath($InvocationControlRoot)
$AdmissionRecord = [IO.Path]::GetFullPath($AdmissionRecord)
$ClosureOutputRoot = [IO.Path]::GetFullPath($ClosureOutputRoot)

if (Test-Path -LiteralPath $FormalRoot) { throw 'Formal root must be fresh and absent.' }
if (Test-Path -LiteralPath $InvocationControlRoot) { throw 'Invocation control root already exists; a second invocation is forbidden.' }
if (-not (Test-Path -LiteralPath $AdmissionRecord -PathType Leaf)) { throw 'Independent ADMITTED record is required.' }

$admission = Get-Content -Raw -LiteralPath $AdmissionRecord | ConvertFrom-Json
$requiredAdmissionFields = @(
  'schemaVersion', 'kind', 'attemptNumber', 'status', 'eligible', 'started',
  'formalInvocationCount', 'decision', 'commandPackageManifestSha256',
  'preparationManifestSha256', 'sealedInputsManifestSha256'
)
foreach ($field in $requiredAdmissionFields) {
  if (-not $admission.PSObject.Properties[$field]) { throw "Admission record is missing $field." }
}
if (
  $admission.schemaVersion -ne 1 -or
  $admission.kind -ne 'acceptance-attempt-8-admission' -or
  $admission.attemptNumber -ne 8 -or
  $admission.status -ne 'ADMITTED' -or
  $admission.eligible -ne $true -or
  $admission.started -ne $false -or
  $admission.formalInvocationCount -ne 0 -or
  $null -ne $admission.decision
) {
  throw 'Admission record schema/state is not Attempt 8 ADMITTED / unstarted / invocation-count-zero.'
}
foreach ($field in @('commandPackageManifestSha256', 'preparationManifestSha256', 'sealedInputsManifestSha256')) {
  if ([string]$admission.$field -cnotmatch '^[0-9a-f]{64}$') { throw "Admission record $field is not a canonical SHA-256." }
}

$packageManifest = Join-Path $PSScriptRoot 'attempt-8-command-package.json'
if (-not (Test-Path -LiteralPath $packageManifest -PathType Leaf)) { throw 'Command-package manifest missing.' }
$package = Get-Content -Raw -LiteralPath $packageManifest | ConvertFrom-Json
$packageVerifierEntry = @($package.files | Where-Object path -eq 'attempt-8-package.mjs')
if ($packageVerifierEntry.Count -ne 1) { throw 'Package verifier bootstrap entry is missing or ambiguous.' }
$packageVerifierHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $PSScriptRoot 'attempt-8-package.mjs')).Hash.ToLowerInvariant()
if ($packageVerifierHash -ne $packageVerifierEntry[0].sha256) { throw 'Package verifier bootstrap identity mismatch.' }
$packageHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $packageManifest).Hash.ToLowerInvariant()
if ($admission.commandPackageManifestSha256 -cne $packageHash) { throw 'Admission record is not bound to this command package.' }

$preparationManifest = Join-Path $PreparationRoot 'attempt-8-preparation-manifest.json'
$sealedManifest = Join-Path $PreparationRoot 'attempt-8-sealed-inputs.json'
if (-not (Test-Path -LiteralPath $preparationManifest -PathType Leaf)) { throw 'Preparation manifest missing.' }
if (-not (Test-Path -LiteralPath $sealedManifest -PathType Leaf)) { throw 'Sealed-input manifest missing.' }
$preparationHashBeforeVerification = (Get-FileHash -Algorithm SHA256 -LiteralPath $preparationManifest).Hash.ToLowerInvariant()
$sealedHashBeforeVerification = (Get-FileHash -Algorithm SHA256 -LiteralPath $sealedManifest).Hash.ToLowerInvariant()
if ($admission.preparationManifestSha256 -cne $preparationHashBeforeVerification) { throw 'Admission record is not bound to this preparation manifest.' }
if ($admission.sealedInputsManifestSha256 -cne $sealedHashBeforeVerification) { throw 'Admission record is not bound to this sealed-input manifest.' }

$packageOutput = & node (Join-Path $PSScriptRoot 'attempt-8-package.mjs') verify $PSScriptRoot $packageManifest 2>&1
if ($LASTEXITCODE -ne 0) { throw "Command package verification failed: $packageOutput" }
$localFixture = Join-Path $PreparationRoot 'sealed-inputs\pinned-input.docx'
$sealedOutput = & node (Join-Path $PSScriptRoot 'attempt-8-sealed-inputs.mjs') verify $PreparationRoot $localFixture $sealedManifest 2>&1
if ($LASTEXITCODE -ne 0) { throw "Preparation or sealed-input verification failed: $sealedOutput" }
$preparationHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $preparationManifest).Hash.ToLowerInvariant()
$sealedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sealedManifest).Hash.ToLowerInvariant()
if ($preparationHash -ne $preparationHashBeforeVerification -or $sealedHash -ne $sealedHashBeforeVerification) {
  throw 'Preparation or sealed-input manifest changed during pre-invocation verification.'
}
if ($admission.preparationManifestSha256 -cne $preparationHash) { throw 'Admission record preparation-manifest binding changed during verification.' }
if ($admission.sealedInputsManifestSha256 -cne $sealedHash) { throw 'Admission record sealed-input binding changed during verification.' }

# Recheck freshness after all potentially long local hashing and inventory work.
if (Test-Path -LiteralPath $FormalRoot) { throw 'Formal root appeared during pre-invocation verification.' }
if (Test-Path -LiteralPath $InvocationControlRoot) { throw 'Invocation control root appeared during pre-invocation verification.' }
New-Item -ItemType Directory -Path $InvocationControlRoot | Out-Null

$verification = [ordered]@{
  schemaVersion = 1
  kind = 'acceptance-attempt-8-pre-invocation-verification'
  attemptNumber = 8
  verifiedAt = (Get-Date).ToUniversalTime().ToString('o')
  classification = 'pre-invocation verification'
  evidenceStatus = 'not acceptance evidence'
  admissionRecord = $AdmissionRecord
  admissionRecordSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $AdmissionRecord).Hash.ToLowerInvariant()
  commandPackageManifestSha256 = $packageHash
  preparationManifestSha256 = $preparationHash
  sealedInputsManifestSha256 = $sealedHash
  commandPackageVerified = $true
  preparationManifestVerified = $true
  sealedLocalInputsVerified = $true
  fixedIdentityConsistencyVerified = $true
  formalRootAbsent = $true
  formalInvocationCountBeforeMarker = 0
  packageVerifierOutput = [string]$packageOutput
  sealedVerifierOutput = [string]$sealedOutput
}
$verificationPath = Join-Path $InvocationControlRoot 'pre-invocation-verification.json'
[IO.File]::WriteAllText($verificationPath, (($verification | ConvertTo-Json -Depth 10) + "`n"), [Text.UTF8Encoding]::new($false))

$markerPath = Join-Path $InvocationControlRoot 'formal-invocation-start.json'
$marker = [ordered]@{
  schemaVersion = 1
  kind = 'acceptance-attempt-8-formal-invocation-marker'
  attemptNumber = 8
  createdAt = (Get-Date).ToUniversalTime().ToString('o')
  formalInvocationCount = 1
  preInvocationVerificationSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $verificationPath).Hash.ToLowerInvariant()
  commandPackageManifestSha256 = $packageHash
  preparationManifestSha256 = $preparationHash
  sealedInputsManifestSha256 = $sealedHash
  firstCandidateBehaviorGate = 'node-candidate-positive-negative-reuse-recovery-abi-cleanup'
}
$markerJson = ($marker | ConvertTo-Json -Depth 10) + "`n"
$markerHandle = [IO.File]::Open($markerPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
try {
  $markerBytes = [Text.UTF8Encoding]::new($false).GetBytes($markerJson)
  $markerHandle.Write($markerBytes, 0, $markerBytes.Length)
} finally {
  $markerHandle.Dispose()
}

$formalExit = 1
$formalError = $null
$closureError = $null
try {
  & pwsh -NoLogo -NoProfile -File (Join-Path $PSScriptRoot 'attempt-8-formal.ps1') -PreparationRoot $PreparationRoot -FormalRoot $FormalRoot -InvocationMarker $markerPath 1> (Join-Path $InvocationControlRoot 'formal.stdout.log') 2> (Join-Path $InvocationControlRoot 'formal.stderr.log')
  $formalExit = $LASTEXITCODE
  if ($formalExit -ne 0) { $formalError = "Formal runner exited $formalExit." }
} catch {
  $formalError = $_.Exception.Message
} finally {
  $completionPath = Join-Path $InvocationControlRoot 'formal-invocation-completion.json'
  $completion = [ordered]@{
    schemaVersion = 1
    kind = 'acceptance-attempt-8-formal-supervisor-completion'
    attemptNumber = 8
    completedAt = (Get-Date).ToUniversalTime().ToString('o')
    formalInvocationCount = 1
    formalProcessExitCode = $formalExit
    formalProcessError = $formalError
    retryPerformed = $false
  }
  $completionJson = ($completion | ConvertTo-Json -Depth 10) + "`n"
  $completionHandle = [IO.File]::Open($completionPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
  try {
    $completionBytes = [Text.UTF8Encoding]::new($false).GetBytes($completionJson)
    $completionHandle.Write($completionBytes, 0, $completionBytes.Length)
  } finally {
    $completionHandle.Dispose()
  }
  try {
    & node (Join-Path $PSScriptRoot 'attempt-8-close.mjs') $FormalRoot $InvocationControlRoot $ClosureOutputRoot
    if ($LASTEXITCODE -ne 0) { $closureError = "Automatic closure exited $LASTEXITCODE." }
  } catch {
    $closureError = $_.Exception.Message
  }
}

if ($closureError) { throw "Attempt 8 automatic closure failed after formal invocation: $closureError" }
if ($formalError) { throw $formalError }
Write-Output 'Attempt 8 formal invocation completed and automatic closure artifacts were created.'
