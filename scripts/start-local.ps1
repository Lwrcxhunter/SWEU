$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$phpBinary = Join-Path $runtimeDirectory 'php/php.exe'
$localConfig = Join-Path $runtimeDirectory 'php/php.ini'
if (-not (Test-Path -LiteralPath $phpBinary) -or -not (Test-Path -LiteralPath $localConfig)) {
    throw 'Local PHP runtime is incomplete. Follow laravel/README.md to configure PHP.'
}
$previousConfig = $env:PHPRC
$viteProcess = $null
$laravelDirectory = Join-Path $projectRoot 'laravel'
$hotFile = Join-Path $laravelDirectory 'public/hot'

function Stop-ProcessTree {
    param([int]$ProcessId)

    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-ProcessTree -ProcessId ([int]$child.ProcessId)
    }
    if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
        Stop-Process -Id $ProcessId -Force
    }
}

try {
    $env:PHPRC = $localConfig
    Push-Location $laravelDirectory
    & $phpBinary artisan guidance:setup
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed.' }

    $npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
    $viteProcess = Start-Process -FilePath $npmCommand `
        -ArgumentList 'run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173' `
        -WorkingDirectory $laravelDirectory `
        -PassThru `
        -WindowStyle Hidden

    $viteReady = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if (Test-Path -LiteralPath $hotFile) {
            $viteReady = $true
            break
        }
        if ($viteProcess.HasExited) {
            throw 'Vite development server exited before startup completed.'
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $viteReady) {
        throw 'Vite development server did not create its hot-file.'
    }

    Write-Host 'Open http://127.0.0.1:8000. Frontend hot reload is active.'
    Write-Host 'Use another terminal to create an administrator with scripts/php.ps1 artisan guidance:admin.'
    Write-Host 'Press Ctrl+C to stop Laravel and Vite.'
    & $phpBinary artisan serve --host=127.0.0.1 --port=8000 --no-reload
} finally {
    if (Test-Path -LiteralPath $hotFile) {
        Remove-Item -LiteralPath $hotFile -Force
    }
    if ($viteProcess) {
        Stop-ProcessTree -ProcessId $viteProcess.Id
    }
    if ((Get-Location).Path -eq $laravelDirectory) { Pop-Location }
    $env:PHPRC = $previousConfig
}
