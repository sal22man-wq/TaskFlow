@echo off
title TaskFlow - Windows Server
color 0A

echo ===============================================
echo      TaskFlow Server - Windows Server
echo ===============================================
echo.

echo Checking environment...
if not exist .env (
    echo Creating default .env file...
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=taskflow-secret-key-production >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo Default .env created - please edit database settings
    echo.
)

echo Setting environment variables...
set NODE_ENV=production
set PORT=5000

echo Configuring Windows Firewall...
netsh advfirewall firewall show rule name="TaskFlow Application" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo Firewall rule added successfully
    )
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
echo Default Login Credentials:
echo Username: administrator
echo Password: wdq@#$
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

TaskFlow-Fixed.exe
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% neq 0 (
    echo ERROR: TaskFlow failed to start (Exit Code: %EXIT_CODE%)
    echo.
    echo Common issues:
    echo 1. Database connection problem
    echo 2. Port 5000 already in use
    echo 3. Incorrect .env settings
    echo 4. PostgreSQL not running
) else (
    echo TaskFlow server stopped normally
)

echo.
pause