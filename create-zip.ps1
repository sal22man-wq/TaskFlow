# سكريبت PowerShell لإنشاء أرشيف TaskFlow

# إنشاء مجلد مؤقت
$tempPath = "C:\temp\TaskFlow-Export"
if (Test-Path $tempPath) {
    Remove-Item $tempPath -Recurse -Force
}
New-Item -ItemType Directory -Path $tempPath

# نسخ الملفات الأساسية
$filesToCopy = @(
    "client",
    "server", 
    "shared",
    "package.json",
    "package-export.json",
    "tsconfig.json",
    "vite.config.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "components.json",
    "drizzle.config.ts",
    "Dockerfile",
    "docker-compose.yml",
    "nginx.conf",
    "ecosystem.config.js",
    "healthcheck.js",
    "init.sql",
    "WINDOWS_SERVER_SETUP.md",
    "DEPLOYMENT_GUIDE.md",
    "EXPORT_INSTRUCTIONS.md",
    ".env.example"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            Copy-Item $item $tempPath -Recurse
        } else {
            Copy-Item $item $tempPath
        }
    }
}

# إنشاء ملف README للتنصيب
$readmeContent = @"
# TaskFlow Management System

## للتنصيب على Windows Server:
1. اقرأ ملف WINDOWS_SERVER_SETUP.md
2. تأكد من تنصيب Node.js و PostgreSQL
3. نفذ الأوامر في Command Prompt كمدير

## للتنصيب بـ Docker (أسهل):
1. تأكد من تنصيب Docker Desktop
2. شغل الأمر: docker-compose up -d

## للمساعدة:
- راجع DEPLOYMENT_GUIDE.md للتفاصيل
- راجع EXPORT_INSTRUCTIONS.md للبدائل

تم إنشاؤه: $(Get-Date)
"@

$readmeContent | Out-File -FilePath "$tempPath\README-ARABIC.txt" -Encoding UTF8

# إنشاء ملف الأوامر السريعة
$quickStart = @"
@echo off
echo === TaskFlow Quick Setup ===
echo.
echo 1. Installing dependencies...
npm install
echo.
echo 2. Setting up database...
npm run db:push
echo.
echo 3. Starting application...
npm run dev
echo.
echo Application will start on http://localhost:5000
pause
"@

$quickStart | Out-File -FilePath "$tempPath\quick-start.bat" -Encoding ASCII

# ضغط الملفات
$zipPath = "C:\TaskFlow-Complete-$(Get-Date -Format 'yyyy-MM-dd').zip"
Compress-Archive -Path $tempPath -DestinationPath $zipPath -Force

Write-Host "تم إنشاء الملف المضغوط: $zipPath" -ForegroundColor Green
Write-Host "حجم الملف: $((Get-Item $zipPath).Length / 1MB) MB" -ForegroundColor Yellow

# تنظيف المجلد المؤقت
Remove-Item $tempPath -Recurse -Force

Write-Host "اكتمل! يمكنك نسخ الملف إلى أي مكان." -ForegroundColor Cyan