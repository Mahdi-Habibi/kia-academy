# Creates a USB-ready zip of Kia Academy (no node_modules / build / secrets).
# Output: D:\kia-academy-portable-YYYYMMDD-HHMM.zip

$ErrorActionPreference = 'Stop'
$env:TEMP = 'D:\temp-kia-academy-zip'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$staging = 'D:\kia-academy-portable-staging'
$zipPath = "D:\kia-academy-portable-$stamp.zip"
$src = Join-Path $PSScriptRoot '..'
$src = (Resolve-Path $src).Path
$parent = Split-Path $src -Parent

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $staging 'kia-academy') | Out-Null

robocopy $src (Join-Path $staging 'kia-academy') /E `
  /XD node_modules .next dist .turbo coverage playwright-report test-results .git `
  /XF *.log *.tsbuildinfo .env .env.local .env.docker *.db *.db-journal `
  /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

foreach ($f in @('kia-academy-unified.html', 'education tech Prompt.docx')) {
  $p = Join-Path $parent $f
  if (Test-Path $p) { Copy-Item $p (Join-Path $staging $f) -Force }
}

Push-Location $staging
tar -a -cf $zipPath *
Pop-Location

Remove-Item $staging -Recurse -Force
Remove-Item $env:TEMP -Recurse -Force -ErrorAction SilentlyContinue

$item = Get-Item $zipPath
Write-Host "Created: $($item.FullName) ($([math]::Round($item.Length/1MB,1)) MB)"
Write-Host "Copy this file to your USB. On the other device unzip and follow PORTABLE.md inside kia-academy/."
