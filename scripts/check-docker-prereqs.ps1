# Kia Academy — Docker Desktop / Virtualization check (Windows)
# Run in PowerShell. Does NOT change BIOS — only reports what you must enable.

$ErrorActionPreference = 'Continue'

Write-Host "`nKia Academy Docker prerequisite check`n" -ForegroundColor Cyan

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$sys = systeminfo | Select-String -Pattern "Virtualization Enabled In Firmware|Hyper-V Requirements"
$info = Get-ComputerInfo | Select-Object HyperVisorPresent, HyperVRequirementVirtualizationFirmwareEnabled

Write-Host "CPU: $($cpu.Name)"
Write-Host "SLAT / EPT supported: $($cpu.SecondLevelAddressTranslationExtensions)"
Write-Host "Virtualization enabled in firmware (OS view): $($cpu.VirtualizationFirmwareEnabled)"
Write-Host "Hypervisor present: $($info.HyperVisorPresent)"
Write-Host ""
$sys | ForEach-Object { Write-Host $_.Line }

$vtOn = [bool]$cpu.VirtualizationFirmwareEnabled

Write-Host ""
if (-not $vtOn) {
  Write-Host "BLOCKER: Virtualization is OFF in BIOS/UEFI." -ForegroundColor Red
  Write-Host @"

Docker Desktop on Windows needs Intel VT-x (or AMD-V) enabled in firmware.
This PC reports: Virtualization Enabled In Firmware = No

How to fix (AMI BIOS — common on your board):
  1. Save all work and restart the PC.
  2. Enter BIOS: press Del or F2 during the boot splash.
  3. Open Advanced (or CPU Configuration / Processor).
  4. Set one of these to Enabled:
       - Intel Virtualization Technology
       - VT-x
       - Virtualization
  5. Save & Exit (usually F10), then boot Windows.
  6. Re-run this script, then start Docker Desktop.

Also enable (after BIOS, from elevated PowerShell):
  dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
  dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
  wsl --update
  wsl --set-default-version 2

Then reboot once more and open Docker Desktop.
"@
  exit 1
}

Write-Host "Firmware virtualization looks ON." -ForegroundColor Green
Write-Host "Next: ensure WSL2 is installed, then start Docker Desktop."
Write-Host "  wsl --status"
Write-Host "  wsl --install -d Ubuntu   # if no distro yet"
Write-Host "  Start Docker Desktop, then: pnpm docker:db`n"
exit 0
