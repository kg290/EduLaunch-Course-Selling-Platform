param(
  [switch]$SkipInstall,
  [switch]$SkipSeed,
  [switch]$NoStart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-Command([string]$CommandName) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command '$CommandName' is not available in PATH."
  }
}

function Get-EnvValue([string]$FilePath, [string]$Key) {
  if (-not (Test-Path $FilePath)) {
    return $null
  }

  foreach ($line in Get-Content $FilePath) {
    if ($line -match "^\s*$([regex]::Escape($Key))=(.*)$") {
      return $Matches[1]
    }
  }

  return $null
}

function Set-EnvValue([string]$FilePath, [string]$Key, [string]$Value) {
  $lines = @()
  if (Test-Path $FilePath) {
    $lines = Get-Content $FilePath
  }

  $pattern = "^\s*$([regex]::Escape($Key))="
  $updated = $false

  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$Key=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += "$Key=$Value"
  }

  Set-Content -Path $FilePath -Value $lines
}

function Coalesce([string]$Value, [string]$Fallback) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Fallback
  }
  return $Value
}

function Stop-PortProcess([int]$Port) {
  $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if (-not $connections) {
    return
  }

  foreach ($connection in $connections) {
    $pidToStop = $connection.OwningProcess
    if ($pidToStop -and $pidToStop -ne $PID) {
      try {
        Stop-Process -Id $pidToStop -Force -ErrorAction Stop
        Write-Host "Freed port $Port (stopped PID $pidToStop)"
      } catch {
        Write-Warning "Could not stop PID $pidToStop on port $Port"
      }
    }
  }
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Ensure-Command "node"
Ensure-Command "npm"

$serverEnvPath = Join-Path $projectRoot "server\.env"
$serverEnvExamplePath = Join-Path $projectRoot "server\.env.example"
$rootEnvPath = Join-Path $projectRoot ".env"

Write-Step "Preparing environment"
if (-not (Test-Path $serverEnvPath)) {
  if (-not (Test-Path $serverEnvExamplePath)) {
    throw "Missing server/.env.example. Cannot create server/.env"
  }

  Copy-Item $serverEnvExamplePath $serverEnvPath
  Write-Host "Created server/.env from server/.env.example"
}

$defaults = @{
  PORT       = "5000"
  MONGO_URI  = "mongodb://127.0.0.1:27017/course_platform"
  JWT_SECRET = "course_platform_dev_secret_2026"
  CLIENT_URL = "http://localhost:5173"
}

foreach ($item in $defaults.GetEnumerator()) {
  $existingValue = Get-EnvValue -FilePath $serverEnvPath -Key $item.Key
  if ([string]::IsNullOrWhiteSpace($existingValue)) {
    Set-EnvValue -FilePath $serverEnvPath -Key $item.Key -Value $item.Value
  }
}

if (Test-Path $rootEnvPath) {
  foreach ($key in @("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET")) {
    $serverValue = Get-EnvValue -FilePath $serverEnvPath -Key $key
    $rootValue = Get-EnvValue -FilePath $rootEnvPath -Key $key
    if ([string]::IsNullOrWhiteSpace($serverValue) -and -not [string]::IsNullOrWhiteSpace($rootValue)) {
      Set-EnvValue -FilePath $serverEnvPath -Key $key -Value $rootValue
      Write-Host "Copied $key from root .env to server/.env"
    }
  }
}

if (-not $SkipInstall) {
  Write-Step "Installing dependencies"
  npm install
  npm install --prefix server
  npm install --prefix client
}

if (-not $SkipSeed) {
  Write-Step "Seeding admin data"
  npm run seed:admin --prefix server

  Write-Step "Seeding demo catalog (YouTube + local library)"
  npm run seed:demo --prefix server
}

if (-not $NoStart) {
  Write-Step "Starting application"
  Stop-PortProcess -Port 5000
  Stop-PortProcess -Port 5173

  $serverProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "start", "--prefix", "server") `
    -WorkingDirectory $projectRoot `
    -PassThru

  $clientProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--prefix", "client") `
    -WorkingDirectory $projectRoot `
    -PassThru

  Write-Host ""
  Write-Host "Backend:  http://localhost:5000"
  Write-Host "Frontend: http://localhost:5173"
  Write-Host "Server PID: $($serverProcess.Id)"
  Write-Host "Client PID: $($clientProcess.Id)"
  Write-Host ""
  $adminEmail = Coalesce (Get-EnvValue $serverEnvPath "ADMIN_EMAIL") "admin@edulaunch.com"
  $adminPassword = Coalesce (Get-EnvValue $serverEnvPath "ADMIN_PASSWORD") "admin123"
  Write-Host "Admin    -> $adminEmail / $adminPassword"
  Write-Host ""
  Write-Host "To stop app:"
  Write-Host "Stop-Process -Id $($serverProcess.Id),$($clientProcess.Id)"
}

Write-Step "Done"
