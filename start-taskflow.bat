@echo off
title TaskFlow - Windows Server
color 0A

echo ===============================================
echo      TaskFlow Server - Windows Server
echo ===============================================
echo.

echo Setting environment variables...
set NODE_ENV=production
set PORT=5000

echo Adding Windows Firewall rule...
netsh advfirewall firewall show rule name="TaskFlow Application" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
)

echo Starting TaskFlow Server...
echo.
echo ===============================================
echo Server Information:
echo - Environment: Production
echo - Port: 5000  
echo - Local URL: http://localhost:5000
echo - Network URL: http://%COMPUTERNAME%:5000
echo ===============================================
echo.
echo Default Login:
echo Username: administrator
echo Password: wdq@#$
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

TaskFlow.exe

echo.
echo TaskFlow server stopped
pause