$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localPhp = Join-Path $projectRoot '.runtime/php/php.exe'
$localConfig = Join-Path $projectRoot '.runtime/php/php.ini'
$phpCommand = if (Test-Path -LiteralPath $localPhp) { $localPhp } else { (Get-Command php -ErrorAction Stop).Source }
$previousConfig = $env:PHPRC
try {
    if (Test-Path -LiteralPath $localConfig) { $env:PHPRC = $localConfig }
    Push-Location (Join-Path $projectRoot 'laravel')
    & $phpCommand @args
    $commandExit = $LASTEXITCODE
} finally {
    Pop-Location
    $env:PHPRC = $previousConfig
}
exit $commandExit
