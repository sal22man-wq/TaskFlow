@echo off
chcp 65001 >nul
title TaskFlow - Windows Server
color 0A

echo ===============================================
echo      TaskFlow - نظام إدارة المهام والفرق
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo [%time%] فحص بيئة ويندوز سيرفر...
echo الخادم: %COMPUTERNAME%
echo المستخدم: %USERNAME%
echo المجلد: %CD%
echo.

:: التحقق من وجود ملف .env
if not exist .env (
    echo [%time%] إنشاء ملف الإعدادات...
    if exist .env.example (
        copy .env.example .env >nul
        echo ✅ تم إنشاء ملف .env من القالب
    ) else (
        echo # TaskFlow Configuration > .env
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db >> .env
        echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM% >> .env
        echo NODE_ENV=production >> .env
        echo PORT=5000 >> .env
        echo ✅ تم إنشاء ملف .env افتراضي
    )
    echo.
    echo ⚠️ يرجى تعديل ملف .env بإعدادات قاعدة البيانات الصحيحة
    echo ثم اضغط أي مفتاح للمتابعة...
    pause
)

:: تحميل متغيرات البيئة من ملف .env
for /f "usebackq tokens=1,2 delims==" %%i in (.env) do (
    if not "%%i"=="" if not "%%i"=="#" (
        set "%%i=%%j"
    )
)

echo [%time%] إعداد متغيرات البيئة...
if not defined NODE_ENV set NODE_ENV=production
if not defined PORT set PORT=5000

echo [%time%] فتح المنفذ في Windows Firewall...
netsh advfirewall firewall show rule name="TaskFlow Application" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=%PORT% >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ تم فتح المنفذ %PORT% في Windows Firewall
    ) else (
        echo ⚠️ تعذر فتح المنفذ - قد تحتاج صلاحيات مدير
    )
) else (
    echo ✅ المنفذ %PORT% مفتوح مسبقاً في Windows Firewall
)

echo [%time%] بدء تشغيل خادم TaskFlow...
echo.
echo ===============================================
echo معلومات الخادم:
echo - البيئة: %NODE_ENV%
echo - المنفذ: %PORT%
echo - الرابط المحلي: http://localhost:%PORT%
echo - الرابط على الشبكة: http://%COMPUTERNAME%:%PORT%
echo ===============================================
echo.
echo بيانات تسجيل الدخول الافتراضية:
echo اسم المستخدم: administrator
echo كلمة المرور: wdq@#$
echo.
echo تحكم في الخادم:
echo - اضغط Ctrl+C لإيقاف الخادم
echo - أغلق النافذة لإيقاف الخادم
echo ===============================================
echo.

:: تشغيل التطبيق مع معالجة الأخطاء
TaskFlow.exe
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% neq 0 (
    echo ❌ [%time%] حدث خطأ أثناء تشغيل TaskFlow
    echo رمز الخطأ: %EXIT_CODE%
    echo.
    echo الأسباب المحتملة:
    echo 1. مشكلة في قاعدة البيانات
    echo 2. المنفذ 5000 مستخدم من تطبيق آخر
    echo 3. ملف .env يحتوي على إعدادات خاطئة
    echo 4. PostgreSQL غير متصل
    echo.
    echo للمساعدة في التشخيص، شغل: تشخيص المشاكل.bat
) else (
    echo ✅ [%time%] تم إيقاف خادم TaskFlow بشكل طبيعي
)
echo.
echo اضغط أي مفتاح للإغلاق...
pause