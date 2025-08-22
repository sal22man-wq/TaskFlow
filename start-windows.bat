@echo off
title TaskFlow - Windows Server 2019/2022
color 0A

echo ===============================================
echo      TaskFlow Server - Windows Server
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo [%time%] Checking server environment...
echo OS: Windows Server
echo User: %USERNAME%
echo.

echo [%time%] Setting environment variables...
set NODE_ENV=production
set PORT=5000

echo [%time%] Checking application files...
if not exist "dist\index.js" (
    echo Error: Application not built yet!
    echo Please run: npm run build
    pause
    exit /b 1
)

echo [%time%] Starting TaskFlow server...
echo.
echo ===============================================
echo Server Configuration:
echo - Environment: Production
echo - Port: 5000
echo - Access: http://localhost:5000
echo - Server IP: %COMPUTERNAME%
echo ===============================================
echo.
echo Default Administrator Login:
echo Username: administrator
echo Password: wdq@#$
echo.
echo Server Controls:
echo - Press Ctrl+C to stop server
echo - Check Windows Firewall for port 5000
echo ===============================================
echo.

node dist/index.js

echo.
echo [%time%] TaskFlow server stopped
echo Press any key to close...
pause