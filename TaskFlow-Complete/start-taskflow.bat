@echo off
chcp 65001 >nul 2>&1
title TaskFlow - Task Management System
color 0A

echo ===============================================
echo      TaskFlow - Task Management System  
echo      Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [INFO] Checking system requirements...

:: Check if PostgreSQL is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not found in PATH
    echo [INFO] Please install PostgreSQL and add to PATH
    echo [INFO] Download: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

:: Create .env if not exists
if not exist .env (
    echo [INFO] Creating default .env file...
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=taskflow-secret-key-production >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo [WARN] Please edit .env file with correct database password
    echo.
)

:: Set environment variables
echo [INFO] Setting environment variables...
set NODE_ENV=production
set PORT=5000

:: Configure Windows Firewall
echo [INFO] Configuring Windows Firewall...
netsh advfirewall firewall show rule name="TaskFlow" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Firewall rule added
    )
)

:: Kill any existing processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Starting TaskFlow server...
echo.
echo ===============================================
echo   Server Configuration:
echo   - Environment: Production
echo   - Port: 5000
echo   - Local Access: http://localhost:5000
echo   - Network Access: http://%COMPUTERNAME%:5000
echo ===============================================
echo.
echo   Default Administrator Account:
echo   - Username: administrator
echo   - Password: wdq@#$
echo.
echo   Press Ctrl+C to stop the server
echo ===============================================
echo.

TaskFlow-Complete.exe
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% neq 0 (
    echo [ERROR] TaskFlow failed to start (Code: %EXIT_CODE%)
    echo.
    echo Common issues:
    echo 1. Database connection failed
    echo 2. Port 5000 already in use  
    echo 3. Invalid .env configuration
    echo 4. PostgreSQL service not running
    echo.
    echo Run setup-database.bat to configure database
) else (
    echo [INFO] TaskFlow server stopped normally
)

echo.
pause