Set-StrictMode -Version Latest

function Resolve-Attempt8Application {
  param([Parameter(Mandatory = $true)][string]$Name)

  $command = Get-Command $Name -CommandType Application -ErrorAction Stop | Select-Object -First 1
  return $command.Source
}

function ConvertTo-Attempt8CmdToken {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

  if ($Value.Contains('"')) { throw "Unsupported double quote in cmd.exe argument: $Value" }
  if ($Value.Contains("`r") -or $Value.Contains("`n")) { throw 'Unsupported line break in cmd.exe argument.' }
  if ($Value.Contains('%')) { throw "Unsupported percent expansion marker in cmd.exe argument: $Value" }
  if ($Value.Contains('!')) { throw "Unsupported delayed-expansion marker in cmd.exe argument: $Value" }
  return '"' + $Value + '"'
}

function Set-Attempt8ProcessCommand {
  param(
    [Parameter(Mandatory = $true)][Diagnostics.ProcessStartInfo]$StartInfo,
    [Parameter(Mandatory = $true)][string]$ResolvedExecutable,
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Arguments
  )

  $extension = [IO.Path]::GetExtension($ResolvedExecutable)
  if ($extension -ieq '.cmd' -or $extension -ieq '.bat') {
    if ([string]::IsNullOrWhiteSpace($env:ComSpec)) {
      throw 'ComSpec is required to launch a .cmd or .bat command.'
    }

    $cmdTokens = @((ConvertTo-Attempt8CmdToken $ResolvedExecutable))
    $cmdTokens += @($Arguments | ForEach-Object { ConvertTo-Attempt8CmdToken $_ })

    # ProcessStartInfo.ArgumentList applies Windows argv escaping. cmd.exe does
    # not decode that escaping for its /c command string, which caused Attempt 4
    # to receive literal backslash-escaped quotes. Supply the complete cmd.exe
    # command line through Arguments so /d /s /c receives the conventional raw
    # outer-quoted batch command exactly once.
    $StartInfo.FileName = $env:ComSpec
    $StartInfo.Arguments = '/d /s /c "' + ($cmdTokens -join ' ') + '"'

    return [ordered]@{
      kind = 'cmd-raw-arguments'
      resolvedExecutable = $ResolvedExecutable
      launcher = $StartInfo.FileName
      launcherArguments = $StartInfo.Arguments
      logicalArguments = @($Arguments)
    }
  }

  $StartInfo.FileName = $ResolvedExecutable
  foreach ($argument in $Arguments) {
    [void]$StartInfo.ArgumentList.Add($argument)
  }

  return [ordered]@{
    kind = 'native-argument-list'
    resolvedExecutable = $ResolvedExecutable
    launcher = $StartInfo.FileName
    launcherArguments = $null
    logicalArguments = @($Arguments)
  }
}
