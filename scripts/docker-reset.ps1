# Kia Academy — reset Docker Desktop WSL engine (run AFTER closing Docker Desktop)
# Run in PowerShell. If errors persist, reboot Windows once, then run again.

$ErrorActionPreference = 'Continue'

Write-Host "`nKia Academy Docker reset`n" -ForegroundColor Cyan

Write-Host "1. Stopping Docker processes..."
Get-Process 'Docker Desktop','com.docker.backend','com.docker.build','docker-agent','docker' -ErrorAction SilentlyContinue |
  Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "2. Shutting down WSL..."
wsl --shutdown 2>$null
Start-Sleep -Seconds 3

Write-Host "3. Unregistering Docker WSL distros..."
wsl --unregister docker-desktop 2>$null
wsl --unregister docker-desktop-data 2>$null

Write-Host "4. Removing stale Docker WSL files..."
$paths = @(
  "$env:LOCALAPPDATA\Docker\wsl",
  "$env:LOCALAPPDATA\Docker\backend.lock",
  "$env:LOCALAPPDATA\Docker\frontend.lock",
  "$env:LOCALAPPDATA\Docker\launcher.lock",
  "$env:LOCALAPPDATA\Docker\tasks"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   removed $p"
  }
}

Write-Host "5. Disabling containerd snapshotter (stability workaround)..."
$settingsPath = "$env:APPDATA\Docker\settings-store.json"
if (Test-Path $settingsPath) {
  $json = Get-Content $settingsPath -Raw | ConvertFrom-Json
  $json | Add-Member -NotePropertyName UseContainerdSnapshotter -NotePropertyValue $false -Force
  $json | Add-Member -NotePropertyName LastContainerdSnapshotterEnable -NotePropertyValue 0 -Force
  $json | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
}

Write-Host "6. Installing Ubuntu WSL distro (if missing)..."
$distros = (wsl -l -q 2>$null) -join ' '
if ($distros -notmatch 'Ubuntu') {
  wsl --install -d Ubuntu --no-launch
}

Write-Host "`nDone. Next steps:"
Write-Host "  A) Reboot Windows (recommended if Docker was stuck on 'Starting the Docker Engine')"
Write-Host "  B) Open Docker Desktop and wait until the whale icon is steady/green"
Write-Host "  C) In kia-academy: pnpm docker:db && pnpm db:migrate && pnpm db:seed && pnpm dev"
Write-Host ""
