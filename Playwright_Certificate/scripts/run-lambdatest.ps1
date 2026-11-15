$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cli = Join-Path $projectRoot 'node_modules\.bin\playwright-node-sdk.cmd'

if (-not (Test-Path -LiteralPath $cli)) {
  throw 'LambdaTest Playwright SDK is not installed. Run npm install first.'
}

$driveLetter = $null
if ($projectRoot -match '\s') {
  foreach ($candidate in @('Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'N')) {
    if (-not (Get-PSDrive -Name $candidate -ErrorAction SilentlyContinue)) {
      $driveLetter = $candidate
      break
    }
  }

  if (-not $driveLetter) {
    throw 'No free drive letter is available for the LambdaTest SDK path workaround.'
  }

  & subst.exe "${driveLetter}:" $projectRoot
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not create a temporary drive alias for the project path.'
  }

  $cli = Join-Path "${driveLetter}:\" 'node_modules\.bin\playwright-node-sdk.cmd'
  Push-Location "${driveLetter}:\"
}

$exitCode = 1
try {
  & $cli playwright test @args
  $exitCode = $LASTEXITCODE
}
finally {
  if ($driveLetter) {
    Pop-Location
    & subst.exe "${driveLetter}:" /d | Out-Null
  }
}

exit $exitCode
