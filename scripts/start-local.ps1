$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$phpBinary = Join-Path $runtimeDirectory 'php/php.exe'
$localConfig = Join-Path $runtimeDirectory 'php/php.ini'
if (-not (Test-Path -LiteralPath $phpBinary) -or -not (Test-Path -LiteralPath $localConfig)) {
    throw 'Local PHP runtime is incomplete. Follow laravel/README.md to configure PHP.'
}
$previousConfig = $env:PHPRC
try {
    $env:PHPRC = $localConfig
    Push-Location (Join-Path $projectRoot 'laravel')
    & $phpBinary artisan guidance:setup
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed.' }
    Write-Host 'Open http://127.0.0.1:8000. Use another terminal to create an administrator with scripts/php.ps1 artisan guidance:admin.'
    & $phpBinary artisan serve --host=127.0.0.1 --port=8000 --no-reload
} finally {
    if ((Get-Location).Path -eq (Join-Path $projectRoot 'laravel')) { Pop-Location }
    $env:PHPRC = $previousConfig
}
