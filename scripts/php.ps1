$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localConfig = Join-Path $projectRoot '.runtime/php.ini'
$previousConfig = $env:PHPRC
try {
    if (Test-Path -LiteralPath $localConfig) { $env:PHPRC = $localConfig }
    Push-Location (Join-Path $projectRoot 'laravel')
    & php @args
    $commandExit = $LASTEXITCODE
} finally {
    Pop-Location
    $env:PHPRC = $previousConfig
}
exit $commandExit
