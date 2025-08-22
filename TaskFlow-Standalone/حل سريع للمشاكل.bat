@echo off
chcp 65001 >nul
title حل سريع لمشاكل TaskFlow
color 0C

echo ===============================================
echo        حل سريع لمشاكل TaskFlow
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo سيتم حل المشاكل الشائعة تلقائياً...
echo.

echo [1/5] إصلاح ملف .env...
if not exist .env (
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=taskflow-secret-key-12345 >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo ✅ تم إنشاء ملف .env
) else (
    echo ✅ ملف .env موجود
)

echo [2/5] إصلاح Windows Firewall...
netsh advfirewall firewall delete rule name="TaskFlow Application" >nul 2>&1
netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ تم إصلاح إعدادات Firewall
) else (
    echo ⚠️ تحتاج تشغيل السكريپت كمدير لإصلاح Firewall
)

echo [3/5] البحث عن PostgreSQL...
set POSTGRES_PATH=""
if exist "C:\Program Files\PostgreSQL" (
    for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%i\bin\psql.exe" (
            set POSTGRES_PATH=%%i\bin
            goto :postgres_found
        )
    )
)

:postgres_found
if not %POSTGRES_PATH%=="" (
    echo ✅ تم العثور على PostgreSQL في: %POSTGRES_PATH%
    echo إضافة PostgreSQL إلى PATH مؤقتاً...
    set PATH=%PATH%;%POSTGRES_PATH%
) else (
    echo ❌ PostgreSQL غير مثبت
    echo.
    echo تحميل PostgreSQL:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo بعد التثبيت، أعد تشغيل هذا السكريپت
    pause
    exit /b 1
)

echo [4/5] فحص وإيقاف التطبيقات المتعارضة...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo ✅ تم تحرير المنفذ 5000

echo [5/5] إنشاء قاعدة البيانات...
set /p POSTGRES_PASSWORD=أدخل كلمة مرور PostgreSQL (أو اضغط Enter للافتراضية): 
if "%POSTGRES_PASSWORD%"=="" set POSTGRES_PASSWORD=password

psql -U postgres -h localhost -c "CREATE DATABASE IF NOT EXISTS taskflow_db;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/postgres >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ تم التأكد من وجود قاعدة البيانات
    
    :: تحديث ملف .env بكلمة المرور الصحيحة
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db' | Set-Content .env" >nul 2>&1
    echo ✅ تم تحديث إعدادات قاعدة البيانات
) else (
    echo ❌ فشل في الاتصال بقاعدة البيانات
    echo تحقق من:
    echo 1. تشغيل خدمة PostgreSQL
    echo 2. كلمة المرور الصحيحة
    echo 3. إعدادات الاتصال
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo            تم حل جميع المشاكل!
echo ===============================================
echo.
echo الآن يمكنك تشغيل التطبيق باستخدام:
echo "تشغيل TaskFlow.bat"
echo.
echo أو التشغيل المباشر:
echo "تشغيل مباشر.bat"
echo.

set /p RUN_NOW=هل تريد تشغيل التطبيق الآن؟ (y/n): 
if /i "%RUN_NOW%"=="y" (
    echo بدء تشغيل TaskFlow...
    call "تشغيل TaskFlow.bat"
) else (
    echo يمكنك تشغيل التطبيق لاحقاً
    pause
)