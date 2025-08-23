@echo off
title TaskFlow Complete Removal
color 0C

echo ===============================================
echo       TaskFlow Complete Removal Tool
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo WARNING: This will COMPLETELY remove TaskFlow
echo including database and all user data!
echo.
echo THIS ACTION CANNOT BE UNDONE!
echo.
set /p CONFIRM1=Type REMOVE to confirm complete removal: 

if not "%CONFIRM1%"=="REMOVE" (
    echo Removal cancelled.
    pause
    exit /b 0
)

echo.
echo Are you absolutely sure? All data will be lost!
set /p CONFIRM2=Type YES to proceed: 

if not "%CONFIRM2%"=="YES" (
    echo Removal cancelled.
    pause
    exit /b 0
)

echo.
echo [1/10] Stopping all TaskFlow processes...
taskkill /f /im TaskFlow.exe >nul 2>&1
taskkill /f /im TaskFlow-Fixed.exe >nul 2>&1
taskkill /f /im TaskFlow-Complete.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo [OK] All processes stopped

echo [2/10] Removing database...
if exist .env (
    echo Reading database configuration...
    for /f "tokens=2 delims==" %%a in ('findstr DATABASE_URL .env 2^>nul') do (
        echo Found database URL: %%a
    )
    
    echo Attempting to drop database...
    set /p DROP_DB=Enter PostgreSQL password to drop database (or press Enter to skip): 
    if not "%DROP_DB%"=="" (
        set PGPASSWORD=%DROP_DB%
        psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS taskflow_db;" >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Database dropped successfully
        ) else (
            echo [WARN] Could not drop database - may need manual removal
        )
    ) else (
        echo [SKIP] Database removal skipped
    )
) else (
    echo [INFO] No .env file found, skipping database removal
)

echo [3/10] Removing application files...
cd /d %~dp0
cd..
if exist TaskFlow-Complete (
    rmdir /s /q TaskFlow-Complete
    echo [OK] Application directory removed
)

echo [4/10] Removing system files...
if exist "C:\TaskFlow*" rmdir /s /q "C:\TaskFlow*" >nul 2>&1
if exist "C:\Program Files\TaskFlow" rmdir /s /q "C:\Program Files\TaskFlow" >nul 2>&1
if exist "C:\Program Files (x86)\TaskFlow" rmdir /s /q "C:\Program Files (x86)\TaskFlow" >nul 2>&1
echo [OK] System files removed

echo [5/10] Cleaning registry...
reg delete "HKLM\SOFTWARE\TaskFlow" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\TaskFlow" /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow" /f >nul 2>&1
echo [OK] Registry cleaned

echo [6/10] Removing services...
sc delete "TaskFlow" >nul 2>&1
sc delete "TaskFlowService" >nul 2>&1
echo [OK] Services removed

echo [7/10] Cleaning firewall...
netsh advfirewall firewall delete rule name="TaskFlow" >nul 2>&1
netsh advfirewall firewall delete rule name="TaskFlow Application" >nul 2>&1
netsh advfirewall firewall delete rule name="TaskFlow Server" >nul 2>&1
echo [OK] Firewall cleaned

echo [8/10] Removing user data...
if exist "%USERPROFILE%\AppData\Local\TaskFlow" rmdir /s /q "%USERPROFILE%\AppData\Local\TaskFlow" >nul 2>&1
if exist "%USERPROFILE%\AppData\Roaming\TaskFlow" rmdir /s /q "%USERPROFILE%\AppData\Roaming\TaskFlow" >nul 2>&1
echo [OK] User data removed

echo [9/10] Cleaning temporary files...
del /f /s /q "%TEMP%\TaskFlow*" >nul 2>&1
del /f /s /q "C:\Windows\Temp\TaskFlow*" >nul 2>&1
echo [OK] Temporary files cleaned

echo [10/10] Final cleanup...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo [OK] Ports freed

echo.
echo ===============================================
echo        TaskFlow Completely Removed
echo ===============================================
echo.
echo TaskFlow has been completely removed from this system:
echo.
echo ✓ All processes stopped
echo ✓ Database dropped (if password provided)
echo ✓ Application files removed
echo ✓ System files cleaned
echo ✓ Registry entries removed
echo ✓ Windows services removed
echo ✓ Firewall rules removed
echo ✓ User data removed
echo ✓ Temporary files cleaned
echo ✓ Network ports freed
echo.
echo The system is now completely clean.
echo.
echo Note: PostgreSQL software itself was NOT removed
echo as it may be used by other applications.
echo.
echo Thank you for using TaskFlow!
echo Ashraf Al-Wadq IT Solutions
echo.
echo This window will close in 10 seconds...
timeout /t 10 /nobreak >nul