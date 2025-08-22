@echo off
title TaskFlow Database Setup
color 0B

echo ===============================================
echo      TaskFlow Database Setup
echo ===============================================
echo.

echo Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL not installed
    echo Please install from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
) else (
    echo PostgreSQL found
    psql --version
)

echo.
echo Creating database...
set /p POSTGRES_PASSWORD=Enter PostgreSQL password: 
echo.

echo Creating taskflow_db database...
psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/postgres

echo.
echo Updating .env file...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db' | Set-Content .env"
) else (
    echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
)

echo.
echo ===============================================
echo          Database Setup Complete!
echo ===============================================
echo.
echo You can now run TaskFlow using: start-taskflow.bat
echo.
pause