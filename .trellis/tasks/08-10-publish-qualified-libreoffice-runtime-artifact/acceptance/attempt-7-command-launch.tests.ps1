[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$HelperPath = Join-Path $PSScriptRoot 'attempt-7-command-launch.ps1'
. $HelperPath

function Assert-Contract([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Invoke-ConfiguredProcess {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [hashtable]$Environment = @{}
  )

  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  foreach ($entry in $Environment.GetEnumerator()) {
    $startInfo.Environment[$entry.Key] = [string]$entry.Value
  }
  $contract = Set-Attempt7ProcessCommand -StartInfo $startInfo -ResolvedExecutable $Executable -Arguments $Arguments
  $process = [Diagnostics.Process]::Start($startInfo)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  return [ordered]@{
    contract = $contract
    exitCode = $process.ExitCode
    stdout = $stdout
    stderr = $stderr
  }
}

$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot = Join-Path $tempBase ("lo-runtime-attempt-7-command-launch-{0} with spaces" -f [Guid]::NewGuid().ToString('N'))
$testRoot = [IO.Path]::GetFullPath($testRoot)
Assert-Contract ($testRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) 'Test root escaped the system temp directory.'
Assert-Contract ([IO.Path]::GetFileName($testRoot).StartsWith('lo-runtime-attempt-7-command-launch-', [StringComparison]::Ordinal)) 'Unexpected test-root leaf name.'
New-Item -ItemType Directory -Path $testRoot -ErrorAction Stop | Out-Null

try {
  $captureJs = Join-Path $testRoot 'capture-args.cjs'
  [IO.File]::WriteAllText($captureJs, "const fs = require('node:fs');`nfs.writeFileSync(process.env.ATTEMPT5_CAPTURE, JSON.stringify(process.argv.slice(2)));`n", [Text.UTF8Encoding]::new($false))

  $wrapperBody = "@echo off`r`nnode `"%~dp0capture-args.cjs`" %*`r`nexit /b %errorlevel%`r`n"
  $cmdWrapper = Join-Path $testRoot 'capture wrapper.cmd'
  $batWrapper = Join-Path $testRoot 'capture wrapper.bat'
  [IO.File]::WriteAllText($cmdWrapper, $wrapperBody, [Text.ASCIIEncoding]::new())
  [IO.File]::WriteAllText($batWrapper, $wrapperBody, [Text.ASCIIEncoding]::new())

  $expectedArguments = @(
    'plain',
    'space value',
    '--flag=value',
    'D:\input path\fixture.docx',
    'validates conversion, recovery, assets, and teardown in local-candidate mode',
    'ampersand&value',
    'pipe|value',
    'caret^value',
    'paren(value)'
  )

  $wrapperResults = @()
  foreach ($wrapper in @($cmdWrapper, $batWrapper)) {
    $capturePath = Join-Path $testRoot (([IO.Path]::GetExtension($wrapper)).TrimStart('.') + '-captured.json')
    $result = Invoke-ConfiguredProcess -Executable $wrapper -Arguments $expectedArguments -WorkingDirectory $testRoot -Environment @{ ATTEMPT5_CAPTURE = $capturePath }
    Assert-Contract ($result.exitCode -eq 0) "Wrapper failed: $wrapper; stderr=$($result.stderr)"
    Assert-Contract ($result.contract.kind -eq 'cmd-raw-arguments') "Wrong launcher kind for $wrapper"
    Assert-Contract ($result.contract.launcherArguments.StartsWith('/d /s /c ""', [StringComparison]::Ordinal)) "Missing raw cmd.exe outer-quote contract for $wrapper"
    Assert-Contract (-not $result.contract.launcherArguments.Contains('\"')) "Launcher contains literal backslash-escaped quotes for $wrapper"
    $captured = @((Get-Content -Raw -LiteralPath $capturePath | ConvertFrom-Json))
    Assert-Contract ($captured.Count -eq $expectedArguments.Count) "Argument count changed for $wrapper"
    for ($index = 0; $index -lt $expectedArguments.Count; $index += 1) {
      Assert-Contract ($captured[$index] -ceq $expectedArguments[$index]) "Argument $index changed for ${wrapper}: expected [$($expectedArguments[$index])], got [$($captured[$index])]"
    }
    $wrapperResults += [ordered]@{ extension = [IO.Path]::GetExtension($wrapper); exitCode = $result.exitCode; argumentsPreserved = $true }
  }

  $nonzeroWrapper = Join-Path $testRoot 'nonzero.cmd'
  [IO.File]::WriteAllText($nonzeroWrapper, "@echo off`r`nexit /b 23`r`n", [Text.ASCIIEncoding]::new())
  $nonzero = Invoke-ConfiguredProcess -Executable $nonzeroWrapper -Arguments @() -WorkingDirectory $testRoot
  Assert-Contract ($nonzero.exitCode -eq 23) 'The .cmd child exit code was not propagated.'

  foreach ($unsupported in @('quote"value', "line`nbreak", 'percent%value', 'bang!value')) {
    $threw = $false
    try { [void](ConvertTo-Attempt7CmdToken $unsupported) } catch { $threw = $true }
    Assert-Contract $threw "Unsupported cmd.exe token did not fail closed: $unsupported"
  }

  $toolResults = @()
  foreach ($tool in @('git', 'gh', 'node', 'pnpm')) {
    $resolved = Resolve-Attempt7Application $tool
    $result = Invoke-ConfiguredProcess -Executable $resolved -Arguments @('--version') -WorkingDirectory $testRoot
    Assert-Contract ($result.exitCode -eq 0) "Version probe failed for $tool at ${resolved}: $($result.stderr)"
    $expectedKind = if ([IO.Path]::GetExtension($resolved) -in @('.cmd', '.bat')) { 'cmd-raw-arguments' } else { 'native-argument-list' }
    Assert-Contract ($result.contract.kind -eq $expectedKind) "Wrong launcher kind for $tool at $resolved"
    $toolResults += [ordered]@{ tool = $tool; resolved = $resolved; kind = $result.contract.kind; exitCode = $result.exitCode; version = $result.stdout.Trim() }
  }

  [ordered]@{
    passed = $true
    powerShellVersion = $PSVersionTable.PSVersion.ToString()
    cmdAndBatArgumentsPreserved = $true
    cmdChildExitCodePropagated = $true
    unsupportedExpansionAndQuoteTokensFailClosed = $true
    tools = $toolResults
    wrappers = $wrapperResults
  } | ConvertTo-Json -Depth 10
}
finally {
  $resolvedRoot = [IO.Path]::GetFullPath($testRoot)
  if ($resolvedRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($resolvedRoot).StartsWith('lo-runtime-attempt-7-command-launch-', [StringComparison]::Ordinal)) {
    Remove-Item -LiteralPath $resolvedRoot -Recurse -Force
  } else {
    throw "Refusing to remove unverified test root: $resolvedRoot"
  }
}
