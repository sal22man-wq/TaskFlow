@echo off
title TaskFlow Windows Server Setup
color 0E
cls

echo ===============================================
echo    TaskFlow - Windows Server Setup Script
echo    شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.
echo Checking Windows Server Environment...
echo Server Name: %COMPUTERNAME%
echo User Account: %USERNAME%
echo Current Path: %CD%
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Not running as Administrator
    echo Some features may not work properly
    echo Right-click and select "Run as Administrator"
    echo.
    timeout /t 5
)

echo ===============================================
echo             INSTALLATION STEPS
echo ===============================================
echo.

:: Step 1: Check Node.js
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not installed
    echo.
    echo Download and install Node.js LTS from:
    echo https://nodejs.org/en/download/
    echo.
    echo After installation:
    echo 1. Restart this command prompt
    echo 2. Run this script again
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js installed: %NODE_VERSION%
)

:: Step 2: Check npm
echo [2/8] Checking npm...
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm version: %NPM_VERSION%

:: Step 3: Check PostgreSQL
echo [3/8] Checking PostgreSQL...
pg_config --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL not found in PATH
    echo Please ensure PostgreSQL is installed
    echo Download from: https://www.postgresql.org/download/windows/
    echo.
) else (
    echo ✓ PostgreSQL available
)

:: Step 4: Install Dependencies
echo [4/8] Installing application dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully

:: Step 5: Setup Environment
echo [5/8] Setting up environment configuration...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo ✓ Created .env from template
    ) else (
        echo Creating default .env file...
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
        echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
        echo NODE_ENV=production >> .env
        echo PORT=5000 >> .env
        echo ✓ Created default .env file
    )
) else (
    echo ✓ .env file already exists
)

:: Step 6: Build Application
echo [6/8] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    echo Check for any compilation errors above
    pause
    exit /b 1
)
echo ✓ Application built successfully

:: Step 7: Configure Windows Firewall
echo [7/8] Configuring Windows Server Firewall...
netsh advfirewall firewall show rule name="TaskFlow Application" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Firewall rule added for port 5000
    ) else (
        echo WARNING: Could not add firewall rule
        echo Manually allow port 5000 in Windows Firewall
    )
) else (
    echo ✓ Firewall rule already exists
)

:: Step 8: Create Service Scripts
echo [8/8] Creating service management scripts...

:: Create Windows service installer
echo @echo off > install-service.bat
echo title Install TaskFlow as Windows Service >> install-service.bat
echo echo Installing TaskFlow as Windows Service... >> install-service.bat
echo npm install -g pm2 >> install-service.bat
echo npm install -g pm2-windows-service >> install-service.bat
echo pm2-service-install -n PM2 >> install-service.bat
echo pm2 start start-windows.bat --name TaskFlow >> install-service.bat
echo pm2 save >> install-service.bat
echo echo TaskFlow installed as Windows Service >> install-service.bat
echo pause >> install-service.bat

echo ✓ Service scripts created

echo.
echo ===============================================
echo           INSTALLATION COMPLETED!
echo ===============================================
echo.
echo Next Steps:
echo.
echo 1. Setup PostgreSQL Database:
echo    - Open pgAdmin or psql
echo    - Create database: taskflow_db
echo    - Update .env with correct password
echo.
echo 2. Initialize Database:
echo    npm run db:push
echo.
echo 3. Start Application:
echo    start-windows.bat
echo.
echo 4. Access Application:
echo    http://%COMPUTERNAME%:5000
echo    or http://localhost:5000
echo.
echo Default Login:
echo Username: administrator
echo Password: wdq@#$
echo.
echo Optional - Install as Windows Service:
echo    install-service.bat
echo.
echo ===============================================

echo.
echo Do you want to start the application now? (Y/N)
set /p choice=Enter choice: 
if /i "%choice%"=="Y" (
    echo.
    echo Starting TaskFlow...
    start-windows.bat
) else (
    echo.
    echo You can start TaskFlow later using: start-windows.bat
)

pause