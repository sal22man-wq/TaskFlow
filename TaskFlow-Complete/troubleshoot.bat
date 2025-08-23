@echo off
title TaskFlow Troubleshoot
color 0C

echo ===============================================
echo       TaskFlow Troubleshoot Guide
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [1] PostgreSQL Service Check:
sc query postgresql-x64-15 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL service found
    sc query postgresql-x64-15 | findstr STATE
) else (
    echo [CHECK] Checking other PostgreSQL services...
    sc query | findstr postgresql
    echo.
    echo [INFO] If no services found, start PostgreSQL manually:
    echo - Open Services.msc
    echo - Find PostgreSQL service
    echo - Right-click and Start
)

echo.
echo [2] PostgreSQL Connection Test:
echo Testing with common passwords...

set "passwords=password postgres admin 123456 wdq@#$"
for %%p in (%passwords%) do (
    echo Testing: %%p
    set PGPASSWORD=%%p
    psql -U postgres -h localhost -c "SELECT version();" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Password works: %%p
        echo Use this password in setup-database.bat
        goto :password_works
    )
)

echo [INFO] None of the common passwords worked
echo.

:password_works
echo.
echo [3] Port 5000 Check:
netstat -an | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo [WARN] Port 5000 is in use:
    netstat -ano | findstr :5000
    echo.
    echo [FIX] Kill processes using port 5000:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        echo taskkill /f /pid %%a
    )
) else (
    echo [OK] Port 5000 is available
)

echo.
echo [4] Windows Firewall Check:
netsh advfirewall firewall show rule name="TaskFlow" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Firewall rule exists
) else (
    echo [FIX] Add firewall rule:
    echo netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=5000
)

echo.
echo [5] File System Check:
if exist TaskFlow.exe (
    echo [OK] TaskFlow.exe found
    for %%A in (TaskFlow.exe) do echo Size: %%~zA bytes
) else (
    echo [ERROR] TaskFlow.exe missing
)

if exist client (
    echo [OK] Client folder found
) else (
    echo [ERROR] Client folder missing
)

if exist .env (
    echo [OK] .env file found
    echo Contents:
    type .env
) else (
    echo [WARN] .env file missing - run setup first
)

echo.
echo ===============================================
echo              Common Solutions:
echo ===============================================
echo.
echo 1. PostgreSQL not starting:
echo    - Open Services.msc as Administrator
echo    - Find postgresql service and start it
echo.
echo 2. Wrong password:
echo    - Try: password, postgres, admin, 123456
echo    - Use quick-setup.bat for automatic detection
echo.
echo 3. Port 5000 blocked:
echo    - Close other applications using port 5000
echo    - Check Skype, other web servers
echo.
echo 4. Firewall blocking:
echo    - Run command prompt as Administrator
echo    - Run the firewall command shown above
echo.
echo 5. Application won't start:
echo    - Check all files are copied correctly
echo    - Run setup-database.bat first
echo    - Check Windows Event Viewer for errors
echo.
pause