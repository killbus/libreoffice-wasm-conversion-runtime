function ConvertTo-AcceptanceUtcInstant {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)]
    [AllowNull()]
    [object]$Value,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if ($null -eq $Value) {
    throw "$Name must not be null."
  }

  if ($Value -is [DateTimeOffset]) {
    return ([DateTimeOffset]$Value).ToUniversalTime()
  }

  if ($Value -is [DateTime]) {
    $dateTime = [DateTime]$Value
    if ($dateTime.Kind -eq [DateTimeKind]::Unspecified) {
      throw "$Name is a DateTime with Kind=Unspecified and cannot identify an unambiguous instant."
    }

    return [DateTimeOffset]::new($dateTime).ToUniversalTime()
  }

  if ($Value -is [string]) {
    $text = ([string]$Value).Trim()
    if ($text -notmatch '(?:[zZ]|[+-][0-9]{2}:[0-9]{2})$') {
      throw "$Name must be an ISO-8601 timestamp with an explicit UTC or numeric offset suffix."
    }

    $parsed = [DateTimeOffset]::MinValue
    $styles = [Globalization.DateTimeStyles]::AllowWhiteSpaces -bor
      [Globalization.DateTimeStyles]::AssumeUniversal -bor
      [Globalization.DateTimeStyles]::AdjustToUniversal
    $parsedOk = [DateTimeOffset]::TryParse(
      $text,
      [Globalization.CultureInfo]::InvariantCulture,
      $styles,
      [ref]$parsed
    )
    if (-not $parsedOk) {
      throw "$Name is not a valid invariant ISO-8601 timestamp: $text"
    }

    return $parsed.ToUniversalTime()
  }

  throw "$Name has unsupported timestamp type $($Value.GetType().FullName)."
}

function Assert-SameAcceptanceUtcInstant {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)]
    [AllowNull()]
    [object]$Actual,

    [Parameter(Mandatory = $true)]
    [AllowNull()]
    [object]$Expected,

    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  $actualInstant = ConvertTo-AcceptanceUtcInstant -Value $Actual -Name 'Actual timestamp'
  $expectedInstant = ConvertTo-AcceptanceUtcInstant -Value $Expected -Name 'Expected timestamp'
  if ($actualInstant.UtcDateTime.Ticks -ne $expectedInstant.UtcDateTime.Ticks) {
    $actualText = $actualInstant.ToString('o', [Globalization.CultureInfo]::InvariantCulture)
    $expectedText = $expectedInstant.ToString('o', [Globalization.CultureInfo]::InvariantCulture)
    throw "$Message Actual UTC: $actualText; expected UTC: $expectedText"
  }
}
