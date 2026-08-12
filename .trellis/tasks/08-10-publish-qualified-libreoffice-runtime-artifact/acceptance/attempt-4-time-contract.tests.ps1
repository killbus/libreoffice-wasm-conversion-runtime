[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw 'The Attempt 4 timestamp contract test requires PowerShell 7 or later (pwsh).'
}

. (Join-Path $PSScriptRoot 'attempt-4-time-contract.ps1')

function Assert-ContractTrue([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Assert-ContractThrows([scriptblock]$Action, [string]$Message) {
  $threw = $false
  try {
    & $Action
  } catch {
    $threw = $true
  }

  if (-not $threw) { throw $Message }
}

$frozenText = '2026-08-07T19:26:24Z'
$githubPayload = '{"created_at":"2026-08-07T19:26:24Z"}' | ConvertFrom-Json
$jsonCreatedAt = $githubPayload.created_at
$jsonCreatedAtType = $jsonCreatedAt.GetType().FullName

if ($PSVersionTable.PSVersion -eq [Version]'7.6.4') {
  Assert-ContractTrue ($jsonCreatedAtType -eq 'System.DateTime') 'PowerShell 7.6.4 ConvertFrom-Json created_at behavior changed from System.DateTime.'
}

# Same instant, different supported runtime types.
Assert-SameAcceptanceUtcInstant -Actual $jsonCreatedAt -Expected $frozenText -Message 'ConvertFrom-Json value differs from the frozen timestamp.'
Assert-SameAcceptanceUtcInstant -Actual ([DateTimeOffset]::Parse($frozenText, [Globalization.CultureInfo]::InvariantCulture)) -Expected $frozenText -Message 'DateTimeOffset differs from the frozen timestamp.'

# Same instant, different explicit offset representation.
Assert-SameAcceptanceUtcInstant -Actual '2026-08-07T21:26:24+02:00' -Expected $frozenText -Message 'Equivalent offset timestamp differs from the frozen timestamp.'

# A real instant change and all ambiguous/unsupported inputs must fail closed.
Assert-ContractThrows {
  Assert-SameAcceptanceUtcInstant -Actual '2026-08-07T19:26:25Z' -Expected $frozenText -Message 'Changed timestamp was accepted.'
} 'A one-second timestamp change did not fail closed.'
Assert-ContractThrows {
  ConvertTo-AcceptanceUtcInstant -Value 'not-a-timestamp' -Name 'Invalid timestamp' | Out-Null
} 'An invalid timestamp string did not fail closed.'
Assert-ContractThrows {
  ConvertTo-AcceptanceUtcInstant -Value '2026-08-07T19:26:24' -Name 'Offset-free timestamp' | Out-Null
} 'An offset-free timestamp string did not fail closed.'
Assert-ContractThrows {
  ConvertTo-AcceptanceUtcInstant -Value ([pscustomobject]@{ value = $frozenText }) -Name 'Unsupported timestamp' | Out-Null
} 'An unsupported timestamp object did not fail closed.'
Assert-ContractThrows {
  ConvertTo-AcceptanceUtcInstant -Value ([DateTime]::SpecifyKind([DateTime]'2026-08-07T19:26:24', [DateTimeKind]::Unspecified)) -Name 'Unspecified timestamp' | Out-Null
} 'A DateTime with Kind=Unspecified did not fail closed.'

# Parsing and comparison must not depend on the current regional culture.
$originalCulture = [Globalization.CultureInfo]::CurrentCulture
$originalUiCulture = [Globalization.CultureInfo]::CurrentUICulture
try {
  [Globalization.CultureInfo]::CurrentCulture = [Globalization.CultureInfo]::GetCultureInfo('tr-TR')
  [Globalization.CultureInfo]::CurrentUICulture = [Globalization.CultureInfo]::GetCultureInfo('tr-TR')
  Assert-SameAcceptanceUtcInstant -Actual $jsonCreatedAt -Expected '2026-08-07T21:26:24+02:00' -Message 'Culture change altered timestamp comparison.'
} finally {
  [Globalization.CultureInfo]::CurrentCulture = $originalCulture
  [Globalization.CultureInfo]::CurrentUICulture = $originalUiCulture
}

[ordered]@{
  passed = $true
  powerShellVersion = $PSVersionTable.PSVersion.ToString()
  convertFromJsonCreatedAtType = $jsonCreatedAtType
  frozenUtc = (ConvertTo-AcceptanceUtcInstant -Value $jsonCreatedAt -Name 'JSON timestamp').ToString('o', [Globalization.CultureInfo]::InvariantCulture)
  sameInstantDifferentTypes = $true
  sameInstantDifferentOffset = $true
  changedInstantFailsClosed = $true
  invalidAndAmbiguousInputsFailClosed = $true
  cultureIndependent = $true
} | ConvertTo-Json -Depth 5
