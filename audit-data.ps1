$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$auditFile = Join-Path $projectRoot 'scripts/audit_user_data.sql'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is not installed or docker is not available in PATH.'
}

Push-Location $projectRoot
try {
    & docker compose up --detach postgres
    if ($LASTEXITCODE -ne 0) {
        throw 'PostgreSQL could not be started.'
    }

    Get-Content -Raw $auditFile |
        & docker compose exec -T postgres psql -X -U postgres -d ticket_reservation
    if ($LASTEXITCODE -ne 0) {
        throw 'Invalid user records were found. Correct the rows listed above and run this audit again.'
    }

    Write-Host 'All existing user records satisfy the configured email and student ID rules.' -ForegroundColor Green
}
finally {
    Pop-Location
}
