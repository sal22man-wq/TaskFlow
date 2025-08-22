@echo off
chcp 65001 >nul 2>&1
title TaskFlow Database Setup
color 0B

echo ===============================================
echo       TaskFlow Database Setup
echo       Ashraf Al-Wadq IT Solutions  
echo ===============================================
echo.

echo [INFO] Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not installed or not in PATH
    echo.
    echo Please install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo After installation, add to PATH:
    echo C:\Program Files\PostgreSQL\[version]\bin
    echo.
    pause
    exit /b 1
) else (
    echo [OK] PostgreSQL found:
    psql --version
)

echo.
echo [INFO] Database setup process starting...
echo.

set /p POSTGRES_PASSWORD=Enter PostgreSQL superuser password: 

echo.
echo [INFO] Creating taskflow_db database...
psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/postgres 2>nul

if %errorlevel% equ 0 (
    echo [OK] Database created or already exists
) else (
    echo [WARN] Database might already exist
)

echo [INFO] Updating configuration file...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db' | Set-Content .env" >nul 2>&1
) else (
    echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
)

echo [OK] Configuration updated

echo [INFO] Testing database connection...
psql -U postgres -h localhost -d taskflow_db -c "SELECT version();" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Database connection successful
) else (
    echo [ERROR] Database connection failed
    echo Please check:
    echo 1. PostgreSQL service is running
    echo 2. Password is correct
    echo 3. Connection settings
    pause
    exit /b 1
)

echo.
echo ===============================================
echo          Database Setup Complete!
echo ===============================================
echo.
echo Configuration saved to .env file
echo.
echo You can now start TaskFlow using:
echo start-taskflow.bat
echo.
pause