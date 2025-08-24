@echo off
chcp 65001
cls
echo ================================
echo    TaskFlow Management System
echo    إعداد سريع لـ Windows Server  
echo ================================
echo.

echo 1️⃣  فحص Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مُنصب! تحميل من: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js موجود
)

echo.
echo 2️⃣  فحص PostgreSQL...
pg_config --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL غير مُنصب أو غير في PATH
    echo    تأكد من تنصيبه من: https://postgresql.org
) else (
    echo ✅ PostgreSQL موجود
)

echo.
echo 3️⃣  إنشاء ملف البيئة...
if not exist .env (
    echo DATABASE_URL=postgresql://taskflow_user:YourPassword@localhost:5432/taskflow > .env
    echo SESSION_SECRET=change-this-secret-key-in-production >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo WHATSAPP_SIMULATION=true >> .env
    echo ✅ تم إنشاء ملف .env
) else (
    echo ✅ ملف .env موجود
)

echo.
echo 4️⃣  تنصيب المكتبات... (قد يأخذ وقت)
npm install
if errorlevel 1 (
    echo ❌ فشل في تنصيب المكتبات!
    echo محاولة تنصيب بديلة...
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ فشل نهائياً! راجع WINDOWS_SERVER_SETUP.md
        pause
        exit /b 1
    )
)
echo ✅ تم تنصيب المكتبات

echo.
echo 5️⃣  إعداد قاعدة البيانات...
npm run db:push
if errorlevel 1 (
    echo ❌ فشل إعداد قاعدة البيانات!
    echo تأكد من:
    echo - تشغيل PostgreSQL
    echo - صحة كلمة المرور في .env
    echo - وجود قاعدة البيانات taskflow
    pause
    exit /b 1
)
echo ✅ تم إعداد قاعدة البيانات

echo.
echo 6️⃣  تشغيل التطبيق...
echo ========================================
echo   التطبيق سيعمل على: http://localhost:5000
echo   للإيقاف اضغط Ctrl+C
echo ========================================
echo.

npm run dev

pause