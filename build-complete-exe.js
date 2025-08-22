import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Building complete TaskFlow executable...');

// تأكد من بناء المشروع
console.log('📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// إنشاء الملف التنفيذي
console.log('📦 Creating executable...');
try {
  execSync('npx pkg dist/index.js --targets node18-win-x64 --output TaskFlow-Complete.exe', { 
    stdio: 'inherit' 
  });
} catch (error) {
  console.warn('⚠️ PKG warning (normal):', error.message);
}

// إنشاء المجلد الكامل
const outputDir = 'TaskFlow-Complete';
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir);

console.log('📁 Creating complete deployment package...');

// نسخ الملف التنفيذي
if (fs.existsSync('TaskFlow-Complete.exe')) {
  fs.copyFileSync('TaskFlow-Complete.exe', path.join(outputDir, 'TaskFlow-Complete.exe'));
  console.log('✅ Executable copied');
} else {
  console.error('❌ Executable not found');
  process.exit(1);
}

// إنشاء ملفات .bat بالإنجليزية (بدون مشاكل ترميز)
const startBat = `@echo off
chcp 65001 >nul 2>&1
title TaskFlow - Task Management System
color 0A

echo ===============================================
echo      TaskFlow - Task Management System  
echo      Ashraf Al-Wadq IT Solutions
echo ===============================================
echo.

echo [INFO] Checking system requirements...

:: Check if PostgreSQL is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL not found in PATH
    echo [INFO] Please install PostgreSQL and add to PATH
    echo [INFO] Download: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

:: Create .env if not exists
if not exist .env (
    echo [INFO] Creating default .env file...
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=taskflow-secret-key-production >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo [WARN] Please edit .env file with correct database password
    echo.
)

:: Set environment variables
echo [INFO] Setting environment variables...
set NODE_ENV=production
set PORT=5000

:: Configure Windows Firewall
echo [INFO] Configuring Windows Firewall...
netsh advfirewall firewall show rule name="TaskFlow" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Firewall rule added
    )
)

:: Kill any existing processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Starting TaskFlow server...
echo.
echo ===============================================
echo   Server Configuration:
echo   - Environment: Production
echo   - Port: 5000
echo   - Local Access: http://localhost:5000
echo   - Network Access: http://%COMPUTERNAME%:5000
echo ===============================================
echo.
echo   Default Administrator Account:
echo   - Username: administrator
echo   - Password: wdq@#$
echo.
echo   Press Ctrl+C to stop the server
echo ===============================================
echo.

TaskFlow-Complete.exe
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% neq 0 (
    echo [ERROR] TaskFlow failed to start (Code: %EXIT_CODE%)
    echo.
    echo Common issues:
    echo 1. Database connection failed
    echo 2. Port 5000 already in use  
    echo 3. Invalid .env configuration
    echo 4. PostgreSQL service not running
    echo.
    echo Run setup-database.bat to configure database
) else (
    echo [INFO] TaskFlow server stopped normally
)

echo.
pause`;

const setupBat = `@echo off
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
    echo C:\\Program Files\\PostgreSQL\\[version]\\bin
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
pause`;

const diagBat = `@echo off
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
pause`;

// كتابة ملفات .bat
fs.writeFileSync(path.join(outputDir, 'start-taskflow.bat'), startBat);
fs.writeFileSync(path.join(outputDir, 'setup-database.bat'), setupBat);
fs.writeFileSync(path.join(outputDir, 'diagnostics.bat'), diagBat);

// نسخ ملفات الواجهة الأمامية
if (fs.existsSync('dist/public')) {
  fs.cpSync('dist/public', path.join(outputDir, 'client'), { recursive: true });
  console.log('✅ Client files copied');
} else {
  console.error('❌ Client files not found');
}

// نسخ ملف .env.example
if (fs.existsSync('.env.example')) {
  fs.copyFileSync('.env.example', path.join(outputDir, '.env.example'));
  console.log('✅ .env.example copied');
}

// إنشاء ملف README
const readme = `TaskFlow - Complete Task Management System
==========================================

QUICK START GUIDE:
1. Run: setup-database.bat (first time only)
2. Run: start-taskflow.bat

SYSTEM REQUIREMENTS:
- Windows Server 2016 or later
- PostgreSQL 12 or later
- Internet access for initial setup

ACCESS INFORMATION:
- Local URL: http://localhost:5000
- Network URL: http://[server-name]:5000

DEFAULT LOGIN:
- Username: administrator  
- Password: wdq@#$

FILE DESCRIPTIONS:
- TaskFlow-Complete.exe: Main application (38MB)
- start-taskflow.bat: Start the server
- setup-database.bat: Database configuration
- diagnostics.bat: System troubleshooting
- .env.example: Configuration template
- client/: Web interface files

TROUBLESHOOTING:
1. Run diagnostics.bat to identify issues
2. Check Windows Event Viewer for error logs
3. Ensure PostgreSQL service is running
4. Verify port 5000 is not blocked

SUPPORT:
For technical support, contact:
Ashraf Al-Wadq IT Solutions
==========================================`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readme);

// إحصائيات النسخة الكاملة
console.log('\n✅ Complete TaskFlow package created!');
console.log('\n📊 Package Contents:');
console.log(`   Directory: ${outputDir}/`);
const files = fs.readdirSync(outputDir, { withFileTypes: true });
files.forEach(file => {
  if (file.isFile()) {
    const stat = fs.statSync(path.join(outputDir, file.name));
    const sizeInMB = (stat.size / 1024 / 1024).toFixed(2);
    console.log(`   📄 ${file.name} (${sizeInMB} MB)`);
  } else if (file.isDirectory()) {
    console.log(`   📁 ${file.name}/`);
  }
});

console.log('\n🎯 Instructions for deployment:');
console.log('1. Copy entire TaskFlow-Complete folder to Windows Server');
console.log('2. Run setup-database.bat (as Administrator)');
console.log('3. Run start-taskflow.bat');
console.log('\n✅ Build complete!');