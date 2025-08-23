@echo off
title TaskFlow Database Setup
color 0B

echo ===============================================
echo       TaskFlow Database Setup
echo       Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not found
    echo.
    echo Please install PostgreSQL:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
) else (
    echo [OK] PostgreSQL found
    psql --version
)

echo.
set /p POSTGRES_PASSWORD=Enter PostgreSQL password: 

echo [INFO] Creating database...
psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/postgres 2>nul

echo [INFO] Updating configuration...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db' | Set-Content .env"
) else (
    echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
)

echo [INFO] Testing connection...
psql -U postgres -h localhost -d taskflow_db -c "SELECT 1;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Database ready
) else (
    echo [ERROR] Connection failed
    pause
    exit /b 1
)

echo.
echo ===============================================
echo          Setup Complete!
echo ===============================================
echo.
echo Run: start-taskflow.bat
echo.
pause