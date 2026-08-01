@echo off
REM Builds kia-academy-portable.zip on D: (avoids full C: drive)
set TEMP=D:\Mahdi\tmp
set TMP=D:\Mahdi\tmp
if not exist "D:\Mahdi\tmp" mkdir "D:\Mahdi\tmp"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-portable-zip.ps1"
echo.
pause
