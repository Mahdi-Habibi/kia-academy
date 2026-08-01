# Create Kia Academy portable zip on D: (does not use C: temp)
# Double-click or run: powershell -ExecutionPolicy Bypass -File "D:\Mahdi\code\project M\kia-academy\scripts\make-portable-zip.ps1"

$ErrorActionPreference = 'Stop'

$env:TEMP = 'D:\Mahdi\tmp'
$env:TMP  = 'D:\Mahdi\tmp'
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$root  = 'D:\Mahdi\code\project M'
$src   = Join-Path $root 'kia-academy'
$stage = Join-Path $root '_kia_academy_zip_stage'
$zip   = Join-Path $root 'kia-academy-portable.zip'

Write-Host "Freeing old stage/zip..."
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $zip)   { Remove-Item $zip -Force }

$dest = Join-Path $stage 'kia-academy'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "Copying source (excluding node_modules / build artifacts)..."
# robocopy exit codes 0-7 are success
& robocopy $src $dest /E `
  /XD node_modules .next dist .turbo coverage playwright-report test-results .git .cursor `
  /XF *.log *.tsbuildinfo *.db *.db-journal .env .env.local .env.docker `
  /NFL /NDL /NJH /NJS /NC /NS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

Get-ChildItem $dest -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -in @('.env','.env.local','.env.docker') } |
  Remove-Item -Force

foreach ($extra in @('kia-academy-unified.html', 'education tech Prompt.docx')) {
  $p = Join-Path $root $extra
  if (Test-Path $p) {
    Copy-Item $p (Join-Path $stage $extra) -Force
    Write-Host "  + $extra"
  }
}

Write-Host "Compressing..."
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal

Remove-Item $stage -Recurse -Force

$info = Get-Item $zip
Write-Host ""
Write-Host "READY FOR USB:" -ForegroundColor Green
Write-Host ("  {0}" -f $info.FullName)
Write-Host ("  {0:N1} MB" -f ($info.Length / 1MB))
Write-Host ""
Write-Host "On the other device: unzip, open kia-academy\PORTABLE.md, then pnpm install + migrate + seed."
