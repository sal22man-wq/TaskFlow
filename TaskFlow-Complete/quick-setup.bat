@echo off
title TaskFlow Quick Setup
color 0F

echo ===============================================
echo       TaskFlow Quick Setup
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [INFO] Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not found
    echo Please install from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
) else (
    echo [OK] PostgreSQL found
)

echo.
echo [INFO] Setting up with common password patterns...
echo.

:: Try common default passwords
set PASSWORDS="password" "postgres" "admin" "123456" "wdq@#$"

for %%p in (%PASSWORDS%) do (
    echo Trying password: %%p
    set PGPASSWORD=%%p
    psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Database created with password: %%p
        goto :password_found
    )
    psql -U postgres -h localhost -d taskflow_db -c "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Database already exists, password: %%p
        goto :password_found
    )
)

echo [ERROR] Could not connect with common passwords
echo.
set /p CUSTOM_PASSWORD=Enter your PostgreSQL password manually: 
set PGPASSWORD=%CUSTOM_PASSWORD%
psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" >nul 2>&1
if %errorlevel% neq 0 (
    psql -U postgres -h localhost -d taskflow_db -c "SELECT 1;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to connect with provided password
        pause
        exit /b 1
    )
)
set POSTGRES_PASSWORD=%CUSTOM_PASSWORD%
goto :create_config

:password_found
set POSTGRES_PASSWORD=%%p

:create_config
echo [INFO] Creating configuration...
echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db > .env
echo SESSION_SECRET=taskflow-secret-key-%RANDOM% >> .env
echo NODE_ENV=production >> .env
echo PORT=5000 >> .env

echo [INFO] Testing final connection...
psql -U postgres -h localhost -d taskflow_db -c "SELECT version();" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Connection successful!
) else (
    echo [ERROR] Final test failed
    pause
    exit /b 1
)

echo.
echo ===============================================
echo          Quick Setup Complete!
echo ===============================================
echo.
echo Database: taskflow_db
echo Password: %POSTGRES_PASSWORD%
echo Configuration saved to .env
echo.
echo Now run: start-taskflow.bat
echo.
pause