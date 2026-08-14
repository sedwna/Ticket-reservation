$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

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
