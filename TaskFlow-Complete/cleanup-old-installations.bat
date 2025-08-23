@echo off
title TaskFlow Cleanup Tool
color 0C

echo ===============================================
echo       TaskFlow Cleanup Tool
echo       Remove Old Installations
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo WARNING: This will remove ALL old TaskFlow installations
echo and clean up system files.
echo.
set /p CONFIRM=Type YES to confirm cleanup: 

if not "%CONFIRM%"=="YES" (
    echo Cleanup cancelled.
    pause
    exit /b 0
)

echo.
echo [1/8] Stopping TaskFlow processes...
taskkill /f /im TaskFlow.exe >nul 2>&1
taskkill /f /im TaskFlow-Fixed.exe >nul 2>&1
taskkill /f /im TaskFlow-Complete.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo [OK] Processes stopped

echo [2/8] Removing old executable files...
if exist "C:\TaskFlow.exe" del /f "C:\TaskFlow.exe" >nul 2>&1
if exist "C:\TaskFlow-Fixed.exe" del /f "C:\TaskFlow-Fixed.exe" >nul 2>&1
if exist "C:\Program Files\TaskFlow\*.exe" del /f "C:\Program Files\TaskFlow\*.exe" >nul 2>&1
for %%d in (C D E F) do (
    if exist "%%d:\TaskFlow*.exe" del /f "%%d:\TaskFlow*.exe" >nul 2>&1
)
echo [OK] Old executables removed

echo [3/8] Removing old installation directories...
if exist "C:\TaskFlow-Standalone" rmdir /s /q "C:\TaskFlow-Standalone" >nul 2>&1
if exist "C:\TaskFlow-Fixed" rmdir /s /q "C:\TaskFlow-Fixed" >nul 2>&1
if exist "C:\Program Files\TaskFlow" rmdir /s /q "C:\Program Files\TaskFlow" >nul 2>&1
if exist "C:\Program Files (x86)\TaskFlow" rmdir /s /q "C:\Program Files (x86)\TaskFlow" >nul 2>&1
if exist "%USERPROFILE%\Desktop\TaskFlow*" rmdir /s /q "%USERPROFILE%\Desktop\TaskFlow*" >nul 2>&1
echo [OK] Old directories removed

echo [4/8] Cleaning Windows registry...
reg delete "HKLM\SOFTWARE\TaskFlow" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\TaskFlow" /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow" /f >nul 2>&1
echo [OK] Registry cleaned

echo [5/8] Removing Windows services...
sc delete "TaskFlow" >nul 2>&1
sc delete "TaskFlowService" >nul 2>&1
echo [OK] Services removed

echo [6/8] Cleaning Windows Firewall rules...
netsh advfirewall firewall delete rule name="TaskFlow" >nul 2>&1
netsh advfirewall firewall delete rule name="TaskFlow Application" >nul 2>&1
netsh advfirewall firewall delete rule name="TaskFlow Server" >nul 2>&1
echo [OK] Firewall rules cleaned

echo [7/8] Cleaning temp files...
del /f /s /q "%TEMP%\TaskFlow*" >nul 2>&1
del /f /s /q "%TEMP%\npm-*\TaskFlow*" >nul 2>&1
del /f /s /q "C:\Windows\Temp\TaskFlow*" >nul 2>&1
echo [OK] Temp files cleaned

echo [8/8] Freeing up ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo [OK] Port 5000 freed

echo.
echo ===============================================
echo          Cleanup Summary
echo ===============================================
echo.
echo The following have been cleaned:
echo ✓ All TaskFlow processes stopped
echo ✓ Old executable files removed
echo ✓ Old installation directories removed  
echo ✓ Windows registry entries cleaned
echo ✓ Windows services removed
echo ✓ Firewall rules cleaned
echo ✓ Temporary files removed
echo ✓ Network ports freed
echo.
echo ===============================================
echo           Fresh Installation Ready
echo ===============================================
echo.
echo Your system is now clean for a fresh TaskFlow installation.
echo.
echo To install TaskFlow:
echo 1. Copy TaskFlow-Complete folder to desired location
echo 2. Run quick-setup.bat
echo 3. Run start-taskflow.bat
echo.
echo Note: This cleanup does NOT remove:
echo - PostgreSQL database (taskflow_db)
echo - PostgreSQL software itself
echo - User data and configurations
echo.
echo Thank you for using TaskFlow!
echo Ashraf Al-Wadq IT Solutions
echo.
pause