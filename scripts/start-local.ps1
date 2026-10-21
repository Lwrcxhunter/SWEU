$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localConfig = Join-Path $projectRoot '.runtime/php.ini'
$mongoDirectory = Join-Path $projectRoot '.runtime/mongodb-server'
$mongoBinary = Get-ChildItem -LiteralPath $mongoDirectory -Filter mongod.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $mongoBinary -or -not (Test-Path -LiteralPath $localConfig)) {
    throw 'Local runtime is missing. Follow laravel/README.md to configure PHP and a MongoDB replica set.'
}
$listener = Get-NetTCPConnection -LocalPort 27028 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    $runningMongo = Get-Process -Id $listener.OwningProcess
    if ($runningMongo.Path -ne $mongoBinary.FullName) { throw 'Port 27028 is occupied by a different process. No changes were made.' }
} else {
    New-Item -ItemType Directory -Path (Join-Path $projectRoot '.runtime/mongo-data') -Force | Out-Null
    $process = Start-Process -FilePath $mongoBinary.FullName -WorkingDirectory $projectRoot -ArgumentList @('--dbpath','.runtime/mongo-data','--port','27028','--bind_ip','127.0.0.1','--replSet','guidance','--logpath','.runtime/mongo.log','--logappend') -WindowStyle Hidden -PassThru
    $process.Id | Set-Content -LiteralPath (Join-Path $projectRoot '.runtime/mongo.pid')
    Start-Sleep -Seconds 2
}
$previousConfig = $env:PHPRC
try {
    $env:PHPRC = $localConfig
    & php (Join-Path $PSScriptRoot 'init-local-mongo.php')
    if ($LASTEXITCODE -ne 0) { throw 'Local MongoDB initialization failed.' }
    Push-Location (Join-Path $projectRoot 'laravel')
    & php artisan guidance:setup
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed.' }
    Write-Host 'Open http://127.0.0.1:8000. Use another terminal to create an administrator with scripts/php.ps1 artisan guidance:admin.'
    & php artisan serve --host=127.0.0.1 --port=8000 --no-reload
} finally {
    if ((Get-Location).Path -eq (Join-Path $projectRoot 'laravel')) { Pop-Location }
    $env:PHPRC = $previousConfig
}
