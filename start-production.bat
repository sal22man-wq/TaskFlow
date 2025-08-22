@echo off
title TaskFlow Production Server
color 0A

echo ===============================================
echo      TaskFlow Production Server
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo [%time%] التحقق من متطلبات التشغيل...

:: التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo خطأ: Node.js غير مثبت
    echo يرجى تثبيت Node.js من https://nodejs.org/
    pause
    exit /b 1
)

:: التحقق من وجود ملف package.json
if not exist package.json (
    echo خطأ: لا يمكن العثور على package.json
    echo تأكد من تشغيل هذا الملف في مجلد التطبيق
    pause
    exit /b 1
)

:: التحقق من وجود ملف .env
if not exist .env (
    echo تحذير: ملف .env غير موجود
    if exist .env.example (
        echo إنشاء ملف .env من .env.example...
        copy .env.example .env
        echo.
        echo تم إنشاء ملف .env - يرجى تعديله بالإعدادات الصحيحة
        echo اضغط أي مفتاح للمتابعة بعد تعديل الإعدادات...
        pause
    ) else (
        echo خطأ: لا يوجد ملف .env أو .env.example
        pause
        exit /b 1
    )
)

echo [%time%] التحقق من التبعيات...

:: التحقق من وجود node_modules
if not exist node_modules (
    echo تثبيت التبعيات...
    call npm install
    if %errorlevel% neq 0 (
        echo خطأ في تثبيت التبعيات
        pause
        exit /b 1
    )
)

echo [%time%] بناء التطبيق...

:: بناء التطبيق
call npm run build
if %errorlevel% neq 0 (
    echo خطأ في بناء التطبيق
    pause
    exit /b 1
)

echo [%time%] تشغيل خادم TaskFlow...
echo.
echo التطبيق متاح على: http://localhost:5000
echo.
echo بيانات تسجيل الدخول الافتراضية:
echo اسم المستخدم: administrator
echo كلمة المرور: wdq@#$
echo.
echo للإيقاف: اضغط Ctrl+C
echo ===============================================
echo.

:: تشغيل التطبيق
call npm start

echo.
echo [%time%] تم إيقاف الخادم
pause