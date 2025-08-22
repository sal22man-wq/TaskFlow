@echo off
chcp 65001 >nul 2>&1
title TaskFlow System Diagnostics
color 0E

echo ===============================================
echo       TaskFlow System Diagnostics
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [1/8] System Information:
echo OS: %OS%
echo Computer: %COMPUTERNAME%  
echo User: %USERNAME%
echo Directory: %CD%
echo.

echo [2/8] PostgreSQL Check:
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not found
    echo Install from: https://www.postgresql.org/download/windows/
) else (
    echo [OK] PostgreSQL available
    psql --version
)
echo.

echo [3/8] Port 5000 Check:
netstat -an | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port 5000 in use by:
    netstat -ano | findstr :5000
) else (
    echo [OK] Port 5000 available
)
echo.

echo [4/8] Windows Firewall Check:
netsh advfirewall firewall show rule name="TaskFlow" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Firewall rule missing
) else (
    echo [OK] Firewall rule exists
)
echo.

echo [5/8] Configuration File Check:
if exist .env (
    echo [OK] .env file exists
    echo Contents:
    type .env
) else (
    echo [ERROR] .env file missing
)
echo.

echo [6/8] Executable Check:
if exist TaskFlow-Complete.exe (
    echo [OK] TaskFlow-Complete.exe found
    for %%A in (TaskFlow-Complete.exe) do echo Size: %%~zA bytes
) else (
    echo [ERROR] TaskFlow-Complete.exe missing
)
echo.

echo [7/8] Client Files Check:
if exist client (
    echo [OK] Client folder exists
) else (
    echo [WARN] Client folder missing (UI may not work)
)
echo.

echo [8/8] Quick Connection Test:
echo Testing server startup for 10 seconds...
start /b TaskFlow-Complete.exe
timeout /t 8 /nobreak >nul

curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Server responds on http://localhost:5000
) else (
    echo [ERROR] Server not responding
)
taskkill /f /im TaskFlow-Complete.exe >nul 2>&1

echo.
echo ===============================================
echo              Diagnostic Summary
echo ===============================================
echo.
echo If you see any [ERROR] above, fix those issues first
echo If you see [WARN], the system may still work
echo.
pause