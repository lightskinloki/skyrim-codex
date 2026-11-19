@echo off
title GM Campaign Suite
cd /d "%~dp0"

set "BUN=%USERPROFILE%\.bun\bin\bun.exe"
if not exist "%BUN%" set "BUN=bun"

echo ===========================================
echo    Skyrim Codex  -  GM Campaign Suite
echo ===========================================
echo.

if not exist "node_modules\" (
  echo First run: installing dependencies, please wait...
  "%BUN%" install
  echo.
)

echo Launching... a browser tab will open at http://localhost:8080
echo KEEP THIS WINDOW OPEN while you use the app. Close it to stop the server.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 4; Start-Process 'http://localhost:8080'"

"%BUN%" run dev

echo.
echo Server stopped. Press any key to close this window.
pause >nul
