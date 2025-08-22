@echo off
chcp 65001 >nul
title إعداد قاعدة البيانات - TaskFlow
color 0B

echo ===============================================
echo      إعداد قاعدة البيانات - TaskFlow
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo هذا السكريپت سيساعدك في إعداد قاعدة البيانات
echo.

echo الخطوات المطلوبة:
echo 1. تأكد من تثبيت PostgreSQL
echo 2. إنشاء قاعدة بيانات جديدة
echo 3. تعديل ملف .env
echo.

echo [1] التحقق من PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL غير مثبت أو غير متاح
    echo.
    echo يرجى تثبيت PostgreSQL من:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
) else (
    echo ✅ PostgreSQL متاح
    psql --version
)

echo.
echo [2] إنشاء قاعدة البيانات...
echo.
set /p POSTGRES_PASSWORD=أدخل كلمة مرور PostgreSQL: 
echo.

echo إنشاء قاعدة البيانات taskflow_db...
psql -U postgres -h localhost -c "CREATE DATABASE taskflow_db;" postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/postgres

if %errorlevel% equ 0 (
    echo ✅ تم إنشاء قاعدة البيانات بنجاح
) else (
    echo ⚠️ قاعدة البيانات موجودة مسبقاً أو حدث خطأ
)

echo.
echo [3] تحديث ملف .env...
if exist .env (
    echo تحديث إعدادات قاعدة البيانات في .env...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db' | Set-Content .env"
    echo ✅ تم تحديث ملف .env
) else (
    echo إنشاء ملف .env جديد...
    echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo ✅ تم إنشاء ملف .env
)

echo.
echo ===============================================
echo          تم إعداد قاعدة البيانات!
echo ===============================================
echo.
echo يمكنك الآن تشغيل TaskFlow باستخدام:
echo "تشغيل TaskFlow.bat"
echo.
pause