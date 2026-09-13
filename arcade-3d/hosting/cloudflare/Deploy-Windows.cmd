@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22.13 or newer from https://nodejs.org and open this file again.
 pause
 exit /b 1
)
call npm install --no-audit --no-fund
if errorlevel 1 (
 echo Installation did not finish. Check your connection and try again.
 pause
 exit /b 1
)
call npm run deploy
pause
