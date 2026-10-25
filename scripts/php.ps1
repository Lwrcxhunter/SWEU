$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localPhp = Join-Path $projectRoot '.runtime/php/php.exe'
$localConfig = if (Test-Path -LiteralPath (Join-Path $projectRoot '.runtime/php/php.ini')) {
    Join-Path $projectRoot '.runtime/php/php.ini'
} elseif (Test-Path -LiteralPath (Join-Path $projectRoot '.runtime/php.ini')) {
    Join-Path $projectRoot '.runtime/php.ini'
} else {
    $null
}
$phpCommand = if (Test-Path -LiteralPath $localPhp) { $localPhp } else { (Get-Command php -ErrorAction Stop).Source }
$previousConfig = $env:PHPRC
try {
    if ($localConfig -and (Test-Path -LiteralPath $localConfig)) { $env:PHPRC = $localConfig }
    Push-Location (Join-Path $projectRoot 'laravel')
    & $phpCommand @args
    $commandExit = $LASTEXITCODE
} finally {
    Pop-Location
    $env:PHPRC = $previousConfig
}
exit $commandExit
