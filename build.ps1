$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$environmentFile = Join-Path $projectRoot '.env'
$environmentExample = Join-Path $projectRoot '.env.example'

function New-RandomSecret([int]$byteLength = 32) {
    $bytes = New-Object byte[] $byteLength
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
        return [Convert]::ToBase64String($bytes)
    }
    finally {
        $generator.Dispose()
    }
}

if (-not (Test-Path -LiteralPath $environmentFile)) {
    $contents = Get-Content -Raw -LiteralPath $environmentExample
    $contents = $contents.Replace('replace-with-a-random-database-password', (New-RandomSecret 24))
    $contents = $contents.Replace('replace-with-at-least-32-random-characters', (New-RandomSecret 48))
    $contents = $contents.Replace('replace-with-a-strong-demo-password', (New-RandomSecret 24))
    $contents = $contents.Replace('replace-with-a-strong-dataset-password', (New-RandomSecret 24))
    Set-Content -LiteralPath $environmentFile -Value $contents -Encoding UTF8
    Write-Host 'Created a local .env file with random secrets.' -ForegroundColor Yellow
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is not installed or docker is not available in PATH.'
}

Push-Location $projectRoot
try {
    $null = & docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Desktop is not running. Start Docker Desktop and run this script again.'
    }

    $null = & docker compose version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose is not available. Update Docker Desktop and try again.'
    }

    & docker compose up --detach --build --force-recreate --wait --wait-timeout 180 backend frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Docker services did not become healthy. Recent logs:' -ForegroundColor Red
        & docker compose ps
        & docker compose logs --no-color --tail 100 postgres backend frontend
        Write-Host 'If the logs report invalid existing users, run .\audit-data.ps1 to list them.' -ForegroundColor Yellow
        throw 'Docker build or startup failed.'
    }

    & docker compose ps
    Write-Host 'Docker build and startup completed successfully.' -ForegroundColor Green
    Write-Host 'Frontend: http://localhost:3000'
    Write-Host 'Backend:  http://localhost:8080'
}
finally {
    Pop-Location
}
