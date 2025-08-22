@echo off
chcp 65001 >nul
title تشخيص مشاكل TaskFlow
color 0E

echo ===============================================
echo        تشخيص مشاكل TaskFlow
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo سيتم فحص النظام وإيجاد سبب المشكلة...
echo.

echo [1] معلومات النظام:
echo نظام التشغيل: %OS%
echo اسم الكمبيوتر: %COMPUTERNAME%
echo المستخدم: %USERNAME%
echo المجلد الحالي: %CD%
echo.

echo [2] فحص PostgreSQL:
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL غير مثبت أو غير متاح في PATH
    echo.
    echo الحل: ثبت PostgreSQL من:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo أو أضف PostgreSQL إلى PATH:
    echo C:\Program Files\PostgreSQL\[version]\bin
    echo.
) else (
    echo ✅ PostgreSQL متاح
    for /f "tokens=*" %%i in ('psql --version') do echo %%i
)

echo [3] فحص المنفذ 5000:
netstat -an | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ المنفذ 5000 مستخدم من تطبيق آخر
    echo التطبيقات التي تستخدم المنفذ:
    netstat -ano | findstr :5000
    echo.
    echo الحل: أوقف التطبيق الآخر أو غير المنفذ في .env
) else (
    echo ✅ المنفذ 5000 متاح
)

echo [4] فحص Windows Firewall:
netsh advfirewall firewall show rule name="TaskFlow Application" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ قاعدة Firewall غير موجودة
    echo إضافة قاعدة Firewall...
    netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ تم إضافة قاعدة Firewall بنجاح
    ) else (
        echo ❌ فشل في إضافة قاعدة Firewall - تحتاج صلاحيات مدير
    )
) else (
    echo ✅ قاعدة Firewall موجودة
)

echo [5] فحص ملف .env:
if exist .env (
    echo ✅ ملف .env موجود
    echo محتويات ملف .env:
    type .env
    echo.
) else (
    echo ❌ ملف .env غير موجود
    echo إنشاء ملف .env افتراضي...
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo ✅ تم إنشاء ملف .env
)

echo [6] فحص الملف التنفيذي:
if exist TaskFlow.exe (
    echo ✅ TaskFlow.exe موجود
    for %%A in (TaskFlow.exe) do echo حجم الملف: %%~zA bytes
) else (
    echo ❌ TaskFlow.exe غير موجود
    echo تأكد من نسخ جميع الملفات بشكل صحيح
)

echo [7] فحص ملفات الواجهة الأمامية:
if exist client (
    echo ✅ مجلد client موجود
) else (
    echo ❌ مجلد client غير موجود
    echo ستحدث مشاكل في عرض الواجهة
)

echo [8] اختبار التشغيل:
echo جاري اختبار التشغيل لمدة 10 ثوانٍ...
set NODE_ENV=production
set PORT=5000

timeout /t 2 /nobreak >nul
start /b TaskFlow.exe

timeout /t 8 /nobreak >nul

:: فحص ما إذا كان التطبيق يعمل
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ التطبيق يعمل بنجاح على http://localhost:5000
    taskkill /f /im TaskFlow.exe >nul 2>&1
) else (
    echo ❌ التطبيق لا يستجيب على http://localhost:5000
    taskkill /f /im TaskFlow.exe >nul 2>&1
)

echo.
echo ===============================================
echo              ملخص التشخيص
echo ===============================================
echo.
echo إذا رأيت أي ❌ أعلاه، فهذا سبب المشكلة
echo.
echo الأسباب الشائعة:
echo 1. PostgreSQL غير مثبت
echo 2. ملف .env يحتوي على إعدادات خاطئة
echo 3. المنفذ 5000 مستخدم من تطبيق آخر
echo 4. Windows Firewall يحجب الاتصال
echo 5. الملفات لم تُنسخ بشكل كامل
echo.
echo للحصول على مساعدة إضافية، أرسل محتويات هذه النافذة
echo.
pause