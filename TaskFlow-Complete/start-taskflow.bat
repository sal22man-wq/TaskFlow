@echo off
title TaskFlow Server
color 0A

echo ===============================================
echo        TaskFlow Task Management System
echo        Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [INFO] Checking system requirements...

if not exist .env (
    echo [INFO] Creating default configuration...
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=taskflow-secret-key-production >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo [WARN] Please edit .env with correct database password
    echo.
)

echo [INFO] Setting environment variables...
set NODE_ENV=production
set PORT=5000

echo [INFO] Configuring Windows Firewall...
netsh advfirewall firewall show rule name="TaskFlow" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Starting TaskFlow server...
echo.
echo ===============================================
echo   Server Information:
echo   - Environment: Production
echo   - Port: 5000
echo   - Local: http://localhost:5000
echo   - Network: http://%COMPUTERNAME%:5000
echo ===============================================
echo.
echo   Default Login:
echo   - Username: administrator
echo   - Password: wdq@#$
echo.
echo   Press Ctrl+C to stop
echo ===============================================
echo.

TaskFlow.exe
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% neq 0 (
    echo [ERROR] TaskFlow failed (Exit Code: %EXIT_CODE%)
    echo.
    echo Common fixes:
    echo 1. Run setup-database.bat first
    echo 2. Check PostgreSQL is running
    echo 3. Verify .env database settings
    echo 4. Ensure port 5000 is available
) else (
    echo [INFO] TaskFlow stopped normally
)

pause