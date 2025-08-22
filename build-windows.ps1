# TaskFlow Windows Server Build Script
# شركة اشراق الودق لتكنولوجيا المعلومات

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    TaskFlow - Windows Server Build" -ForegroundColor Green
Write-Host "    بناء ملف التنفيذي لويندوز سيرفر" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Warning "يُنصح بتشغيل PowerShell كمدير"
}

# Step 1: Check Node.js
Write-Host "[1/6] التحقق من Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js مثبت: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Node.js غير مثبت. يرجى تثبيته من https://nodejs.org/"
    exit 1
}

# Step 2: Install dependencies
Write-Host "[2/6] تثبيت التبعيات..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ تم تثبيت التبعيات" -ForegroundColor Green
} catch {
    Write-Error "❌ فشل في تثبيت التبعيات"
    exit 1
}

# Step 3: Install pkg globally
Write-Host "[3/6] تثبيت أداة بناء الملفات التنفيذية..." -ForegroundColor Yellow
try {
    npm install -g pkg
    Write-Host "✅ تم تثبيت pkg" -ForegroundColor Green
} catch {
    Write-Error "❌ فشل في تثبيت pkg"
    exit 1
}

# Step 4: Build application
Write-Host "[4/6] بناء التطبيق..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ تم بناء التطبيق" -ForegroundColor Green
} catch {
    Write-Error "❌ فشل في بناء التطبيق"
    exit 1
}

# Step 5: Create executable
Write-Host "[5/6] إنشاء الملف التنفيذي..." -ForegroundColor Yellow

# Create temporary package.json for exe
$exeConfig = @{
    name = "taskflow-server"
    version = "1.0.0"
    main = "dist/index.js"
    type = "module"
    bin = "dist/index.js"
    pkg = @{
        scripts = @("dist/**/*.js")
        assets = @(
            "client/dist/**/*"
        )
        targets = @("node18-win-x64")
        outputPath = "build"
    }
} | ConvertTo-Json -Depth 10

$exeConfig | Out-File -FilePath "package-exe.json" -Encoding UTF8

try {
    # Build executable
    pkg . --config package-exe.json --out-path build
    
    # Create build directory if not exists
    if (-not (Test-Path "build")) {
        New-Item -ItemType Directory -Path "build"
    }
    
    # Copy client files
    if (Test-Path "client/dist") {
        Copy-Item -Path "client/dist" -Destination "build/client" -Recurse -Force
    }
    
    # Copy environment template
    if (Test-Path ".env.example") {
        Copy-Item -Path ".env.example" -Destination "build/.env.example"
    }
    
    Write-Host "✅ تم إنشاء الملف التنفيذي" -ForegroundColor Green
} catch {
    Write-Error "❌ فشل في إنشاء الملف التنفيذي: $_"
    exit 1
} finally {
    # Clean up temporary files
    if (Test-Path "package-exe.json") {
        Remove-Item "package-exe.json"
    }
}

# Step 6: Create startup script
Write-Host "[6/6] إنشاء سكريپتات التشغيل..." -ForegroundColor Yellow

$startScript = @"
@echo off
title TaskFlow - Windows Server
color 0A

echo ===============================================
echo      TaskFlow Server - Standalone
echo      شركة اشراق الودق لتكنولوجيا المعلومات  
echo ===============================================
echo.

echo [%time%] Setting up Windows Server environment...
echo Server: %COMPUTERNAME%
echo User: %USERNAME%
echo.

:: Set environment variables
set NODE_ENV=production
set PORT=5000

:: Configure Windows Firewall
echo [%time%] Configuring Windows Firewall...
netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1

echo [%time%] Starting TaskFlow Server...
echo.
echo ===============================================
echo Server Information:
echo - URL: http://localhost:5000
echo - URL: http://%COMPUTERNAME%:5000
echo - Environment: Production
echo ===============================================
echo.
echo Default Login Credentials:
echo Username: administrator
echo Password: wdq@#$
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

taskflow-server.exe

echo.
echo [%time%] TaskFlow server stopped
pause
"@

$startScript | Out-File -FilePath "build/start-taskflow.bat" -Encoding ASCII

# Create installation guide
$readme = @"
TaskFlow - Windows Server Application
شركة اشراق الودق لتكنولوجيا المعلومات

=== متطلبات التشغيل ===
1. Windows Server 2016 أو أحدث
2. PostgreSQL 12 أو أحدث

=== خطوات التشغيل ===
1. تأكد من تثبيت PostgreSQL وإنشاء قاعدة بيانات: taskflow_db
2. انسخ .env.example إلى .env وعدل إعدادات قاعدة البيانات
3. شغل: start-taskflow.bat

=== الوصول للتطبيق ===
- الرابط المحلي: http://localhost:5000
- الرابط على الشبكة: http://[server-name]:5000

=== بيانات تسجيل الدخول الافتراضية ===
- اسم المستخدم: administrator
- كلمة المرور: wdq@#$

=== ملاحظات أمنية ===
- غير كلمة المرور الافتراضية فور تسجيل الدخول
- تأكد من إعدادات Windows Firewall
- اعمل نسخة احتياطية من قاعدة البيانات بانتظام

=== الدعم الفني ===
راجع ملفات الوثائق المرفقة أو اتصل بفريق الدعم
"@

$readme | Out-File -FilePath "build/README.txt" -Encoding UTF8

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "         تم إنشاء الملف التنفيذي بنجاح!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الملفات المُنشأة:" -ForegroundColor Yellow
Write-Host "📁 مجلد البناء: build/" -ForegroundColor White
Write-Host "⚡ الملف التنفيذي: build/taskflow-server.exe" -ForegroundColor White
Write-Host "🚀 سكريپت التشغيل: build/start-taskflow.bat" -ForegroundColor White
Write-Host "📖 دليل التشغيل: build/README.txt" -ForegroundColor White
Write-Host ""
Write-Host "للتشغيل:" -ForegroundColor Yellow
Write-Host "1. انتقل إلى مجلد build/" -ForegroundColor White
Write-Host "2. شغل start-taskflow.bat" -ForegroundColor White
Write-Host ""
Write-Host "أو شغل مباشرة: build/taskflow-server.exe" -ForegroundColor White
Write-Host ""

# Ask if user wants to test the executable
$choice = Read-Host "هل تريد تشغيل الملف التنفيذي الآن؟ (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "بدء تشغيل TaskFlow..." -ForegroundColor Green
    Set-Location build
    Start-Process "start-taskflow.bat"
}