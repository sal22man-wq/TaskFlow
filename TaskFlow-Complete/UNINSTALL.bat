@echo off
title TaskFlow Uninstaller
color 0C

echo ===============================================
echo        TaskFlow Uninstaller
echo        Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo WARNING: This will completely remove TaskFlow
echo and all its data from this system.
echo.
set /p CONFIRM=Are you sure? Type YES to confirm: 

if not "%CONFIRM%"=="YES" (
    echo Uninstall cancelled.
    pause
    exit /b 0
)

echo.
echo [1/5] Stopping TaskFlow processes...
taskkill /f /im TaskFlow-Complete.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] TaskFlow processes stopped
) else (
    echo [INFO] No running TaskFlow processes found
)

echo [2/5] Removing Windows Firewall rule...
netsh advfirewall firewall delete rule name="TaskFlow" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Firewall rule removed
) else (
    echo [INFO] Firewall rule not found
)

echo [3/5] Removing database (OPTIONAL)...
set /p REMOVE_DB=Remove TaskFlow database? (y/n): 
if /i "%REMOVE_DB%"=="y" (
    if exist .env (
        echo [INFO] Reading database configuration...
        for /f "tokens=2 delims==" %%a in ('findstr DATABASE_URL .env') do (
            echo [WARN] Please manually drop database: taskflow_db
            echo [INFO] Connect to PostgreSQL and run: DROP DATABASE taskflow_db;
        )
    )
    echo [INFO] Database removal instructions displayed
) else (
    echo [INFO] Database kept (can be reused later)
)

echo [4/5] Removing application files...
cd /d %~dp0
cd..
if exist TaskFlow-Complete (
    echo [INFO] Removing TaskFlow-Complete directory...
    rmdir /s /q TaskFlow-Complete
    echo [OK] Application files removed
) else (
    echo [INFO] TaskFlow directory not found
)

echo [5/5] Cleanup completed
echo.
echo ===============================================
echo     TaskFlow has been uninstalled
echo ===============================================
echo.
echo Manual cleanup (if needed):
echo 1. Remove PostgreSQL if not used by other apps
echo 2. Check Windows Services for any remaining entries
echo 3. Clear browser cache/cookies for localhost:5000
echo.
echo Thank you for using TaskFlow!
echo Ashraf Al-Wadq IT Solutions
echo.
pause