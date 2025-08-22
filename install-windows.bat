@echo off
title TaskFlow Installation - Windows Server 2019/2022
color 0B

echo ===============================================
echo      TaskFlow Installation Script
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo [%time%] بدء عملية التثبيت...
echo.

:: التحقق من صلاحيات المدير
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo تحذير: يُنصح بتشغيل هذا الملف كمدير
    echo.
)

:: التحقق من Node.js
echo [1/6] التحقق من Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo خطأ: Node.js غير مثبت
    echo.
    echo يرجى تثبيت Node.js أولاً:
    echo 1. اذهب إلى https://nodejs.org/
    echo 2. حمل النسخة LTS
    echo 3. ثبت البرنامج
    echo 4. أعد تشغيل Command Prompt
    echo.
    pause
    exit /b 1
) else (
    echo ✓ Node.js مثبت بنجاح
    node --version
    npm --version
)

echo.
echo [2/6] التحقق من PostgreSQL...
:: التحقق من PostgreSQL
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo تحذير: PostgreSQL غير متاح في PATH
    echo تأكد من تثبيت PostgreSQL من:
    echo https://www.postgresql.org/download/windows/
    echo.
) else (
    echo ✓ PostgreSQL متاح
    psql --version
)

echo.
echo [3/6] تثبيت تبعيات التطبيق...
call npm install
if %errorlevel% neq 0 (
    echo خطأ في تثبيت التبعيات
    pause
    exit /b 1
)
echo ✓ تم تثبيت التبعيات بنجاح

echo.
echo [4/6] إعداد ملف البيئة...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo ✓ تم إنشاء ملف .env
    ) else (
        echo إنشاء ملف .env افتراضي...
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow_db > .env
        echo SESSION_SECRET=change-this-to-a-secure-random-string >> .env
        echo NODE_ENV=production >> .env
        echo PORT=5000 >> .env
        echo ✓ تم إنشاء ملف .env افتراضي
    )
) else (
    echo ✓ ملف .env موجود مسبقاً
)

echo.
echo [5/6] بناء التطبيق...
call npm run build
if %errorlevel% neq 0 (
    echo خطأ في بناء التطبيق
    echo تحقق من وجود جميع الملفات المطلوبة
    pause
    exit /b 1
)
echo ✓ تم بناء التطبيق بنجاح

echo.
echo [5.1/6] إعداد Windows Firewall...
echo إضافة استثناء للمنفذ 5000...
netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ تم إعداد Windows Firewall بنجاح
) else (
    echo تحذير: فشل في إعداد Windows Firewall - قد تحتاج صلاحيات مدير
)

echo.
echo [6/6] إنشاء سكريپتات التشغيل...

:: إنشاء سكريپت بدء التطبيق
echo @echo off > run-taskflow.bat
echo title TaskFlow Server >> run-taskflow.bat
echo echo Starting TaskFlow Server... >> run-taskflow.bat
echo call npm start >> run-taskflow.bat
echo pause >> run-taskflow.bat

echo ✓ تم إنشاء run-taskflow.bat

:: إنشاء سكريپت تثبيت الخدمة
echo @echo off > install-service.bat
echo title Install TaskFlow Service >> install-service.bat
echo echo Installing TaskFlow as Windows Service... >> install-service.bat
echo npm install -g pm2 >> install-service.bat
echo npm install -g pm2-windows-service >> install-service.bat
echo call pm2-service-install >> install-service.bat
echo call pm2 start npm --name "TaskFlow" -- start >> install-service.bat
echo call pm2 save >> install-service.bat
echo echo Service installed successfully! >> install-service.bat
echo pause >> install-service.bat

echo ✓ تم إنشاء install-service.bat

echo.
echo ===============================================
echo          تم التثبيت بنجاح!
echo ===============================================
echo.
echo الخطوات التالية:
echo.
echo 1. إعداد قاعدة البيانات:
echo    - افتح pgAdmin
echo    - انشئ قاعدة بيانات جديدة: taskflow_db
echo.
echo 2. تعديل إعدادات قاعدة البيانات:
echo    - افتح ملف .env
echo    - عدل DATABASE_URL بكلمة مرور postgres الصحيحة
echo.
echo 3. إعداد قاعدة البيانات الأولي:
echo    npm run db:push
echo.
echo 4. تشغيل التطبيق:
echo    run-taskflow.bat
echo.
echo 5. الوصول إلى التطبيق:
echo    http://localhost:5000
echo.
echo بيانات تسجيل الدخول الافتراضية:
echo اسم المستخدم: administrator
echo كلمة المرور: wdq@#$
echo.
echo ===============================================

echo.
echo هل تريد تشغيل التطبيق الآن؟ (y/n)
set /p choice=
if /i "%choice%"=="y" (
    echo.
    echo تشغيل التطبيق...
    call run-taskflow.bat
) else (
    echo.
    echo يمكنك تشغيل التطبيق لاحقاً باستخدام: run-taskflow.bat
)

pause