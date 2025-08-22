# سكريبت بناء TaskFlow لويندوز سيرفر
# PowerShell Script for Building TaskFlow for Windows Server

param(
    [string]$BuildType = "standalone",
    [string]$OutputDir = "dist",
    [switch]$IncludeDatabase = $false
)

Write-Host "🚀 بدء عملية بناء TaskFlow لويندوز سيرفر..." -ForegroundColor Green

# إنشاء مجلد الإخراج
if (Test-Path $OutputDir) {
    Remove-Item -Recurse -Force $OutputDir
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# نسخ الملفات الأساسية
Write-Host "📁 نسخ الملفات الأساسية..." -ForegroundColor Yellow

$filesToCopy = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "drizzle.config.ts",
    "vite.config.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "components.json",
    ".env.example",
    "README.md"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item $file $OutputDir -Force
    }
}

# نسخ المجلدات
$foldersToTransfer = @("server", "client", "shared")
foreach ($folder in $foldersToTransfer) {
    if (Test-Path $folder) {
        Copy-Item -Recurse $folder $OutputDir -Force
    }
}

# إنشاء سكريبت التثبيت
Write-Host "📝 إنشاء سكريبت التثبيت..." -ForegroundColor Yellow

@"
@echo off
echo ===============================================
echo TaskFlow Installation Script
echo ===============================================

echo Installing Node.js dependencies...
call npm install

echo Building the application...
call npm run build

echo Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your database credentials
)

echo ===============================================
echo Installation completed successfully!
echo ===============================================
echo.
echo Next steps:
echo 1. Edit .env file with your database URL
echo 2. Run: npm run db:push
echo 3. Run: npm start
echo.
pause
"@ | Out-File -FilePath "$OutputDir\install.bat" -Encoding ascii

# إنشاء سكريبت التشغيل
@"
@echo off
title TaskFlow Server
echo Starting TaskFlow Server...
echo Press Ctrl+C to stop the server
echo.
call npm start
pause
"@ | Out-File -FilePath "$OutputDir\start.bat" -Encoding ascii

# إنشاء سكريبت الخدمة
@"
@echo off
echo Installing TaskFlow as Windows Service...

npm install -g pm2
npm install -g pm2-windows-service

echo Setting up PM2 service...
call pm2-service-install

echo Adding TaskFlow to PM2...
call pm2 start npm --name "TaskFlow" -- start
call pm2 save

echo TaskFlow service installed successfully!
echo Use 'pm2 list' to check status
echo Use 'pm2 logs TaskFlow' to view logs
pause
"@ | Out-File -FilePath "$OutputDir\install-service.bat" -Encoding ascii

# إنشاء ملف الإعدادات
@"
# TaskFlow Configuration File
# Copy this to .env and modify as needed

DATABASE_URL=postgresql://username:password@localhost:5432/taskflow_db
SESSION_SECRET=change-this-to-a-secure-random-string
NODE_ENV=production
PORT=5000

# WhatsApp Settings (optional)
WHATSAPP_ENABLED=false

# Object Storage (if using file uploads)
# These will be set automatically when using Replit Object Storage
# PUBLIC_OBJECT_SEARCH_PATHS=
# PRIVATE_OBJECT_DIR=
"@ | Out-File -FilePath "$OutputDir\.env.example" -Encoding utf8

# إنشاء دليل النشر
@"
# TaskFlow Windows Deployment Guide

## Quick Start

1. **Install Prerequisites:**
   - Node.js 18+ (https://nodejs.org/)
   - PostgreSQL 14+ (https://www.postgresql.org/)

2. **Setup Database:**
   ```sql
   CREATE DATABASE taskflow_db;
   CREATE USER taskflow_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow_user;
   ```

3. **Install Application:**
   ```cmd
   install.bat
   ```

4. **Configure Environment:**
   - Edit .env file with your database credentials
   - Set SESSION_SECRET to a random string

5. **Initialize Database:**
   ```cmd
   npm run db:push
   ```

6. **Start Application:**
   ```cmd
   start.bat
   ```

## Service Installation

To run TaskFlow as a Windows service:

```cmd
install-service.bat
```

## Default Login

- Username: administrator
- Password: wdq@#$

## Troubleshooting

### Port Issues
If port 5000 is busy, change PORT in .env file.

### Database Connection
Ensure PostgreSQL is running and credentials are correct in .env file.

### Firewall
Open port 5000 in Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "TaskFlow" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
```

## Support

For technical support, check the logs:
```cmd
pm2 logs TaskFlow
```
"@ | Out-File -FilePath "$OutputDir\DEPLOYMENT.md" -Encoding utf8

if ($BuildType -eq "executable") {
    Write-Host "🔧 إنشاء ملف تنفيذي..." -ForegroundColor Yellow
    
    # تثبيت pkg إذا لم يكن مثبتاً
    npm list -g pkg 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "تثبيت pkg..." -ForegroundColor Yellow
        npm install -g pkg
    }
    
    # بناء التطبيق أولاً
    npm run build
    
    # إنشاء ملف pkg config
    @"
{
  "pkg": {
    "targets": ["node18-win-x64"],
    "outputPath": "$OutputDir",
    "assets": [
      "client/dist/**/*",
      "shared/**/*",
      "node_modules/**/*"
    ],
    "scripts": [
      "server/**/*.js",
      "shared/**/*.js"
    ]
  }
}
"@ | Out-File -FilePath "pkg-config.json" -Encoding utf8
    
    # بناء الملف التنفيذي
    pkg server/index.ts --config pkg-config.json --output "$OutputDir/taskflow.exe"
    
    # تنظيف ملف التكوين
    Remove-Item "pkg-config.json" -Force
}

# إنشاء أرشيف مضغوط
Write-Host "📦 إنشاء أرشيف مضغوط..." -ForegroundColor Yellow

$archiveName = "TaskFlow-Windows-$(Get-Date -Format 'yyyy-MM-dd').zip"
Compress-Archive -Path "$OutputDir\*" -DestinationPath $archiveName -Force

Write-Host "✅ تم بناء TaskFlow بنجاح!" -ForegroundColor Green
Write-Host "📁 الملفات متاحة في: $OutputDir" -ForegroundColor Cyan
Write-Host "📦 الأرشيف المضغوط: $archiveName" -ForegroundColor Cyan

Write-Host "`n🎯 خطوات التثبيت على ويندوز سيرفر:" -ForegroundColor Yellow
Write-Host "1. نسخ الأرشيف إلى السيرفر وفك الضغط" -ForegroundColor White
Write-Host "2. تشغيل install.bat" -ForegroundColor White
Write-Host "3. تعديل ملف .env" -ForegroundColor White
Write-Host "4. تشغيل npm run db:push" -ForegroundColor White
Write-Host "5. تشغيل start.bat" -ForegroundColor White

if ($IncludeDatabase) {
    Write-Host "`n💾 تصدير قاعدة البيانات..." -ForegroundColor Yellow
    
    # تصدير هيكل قاعدة البيانات
    if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
        $dbBackup = "$OutputDir\database-schema.sql"
        pg_dump --schema-only $env:DATABASE_URL > $dbBackup
        Write-Host "✅ تم تصدير هيكل قاعدة البيانات: $dbBackup" -ForegroundColor Green
    } else {
        Write-Host "⚠️  pg_dump غير متوفر. تخطي تصدير قاعدة البيانات." -ForegroundColor Yellow
    }
}

Write-Host "`n🔗 روابط مفيدة:" -ForegroundColor Cyan
Write-Host "Node.js: https://nodejs.org/" -ForegroundColor Blue
Write-Host "PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Blue
Write-Host "PM2: https://pm2.keymetrics.io/" -ForegroundColor Blue

Write-Host "`n🎉 تم الانتهاء من عملية البناء!" -ForegroundColor Green