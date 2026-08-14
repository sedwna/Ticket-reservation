$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker Desktop is not installed or docker is not available in PATH."
    }

    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop is not running."
    }

    docker compose --profile seed run --rm full-data
    if ($LASTEXITCODE -ne 0) {
        throw "Full dataset import failed. PostgreSQL rolled back the import."
    }

    Write-Host "Full dataset imported and validated successfully." -ForegroundColor Green
    Write-Host "Admin: ticket.reservation.demo+full.user001@gmail.com / REMOVED_SECRET"
    Write-Host "Active user: ticket.reservation.demo+full.user051@gmail.com / REMOVED_SECRET"
    Write-Host "Inactive user: ticket.reservation.demo+full.user171@gmail.com / REMOVED_SECRET"
}
finally {
    Pop-Location
}
