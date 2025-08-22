import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 إنشاء TaskFlow - الإصدار المستقل الشامل');
console.log('شركة اشراق الودق لتكنولوجيا المعلومات');
console.log('===============================================');

// إنشاء مجلد البناء
if (!fs.existsSync('TaskFlow-Standalone')) {
  fs.mkdirSync('TaskFlow-Standalone');
}

console.log('📦 [1/8] بناء التطبيق...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ تم بناء التطبيق');
} catch (error) {
  console.error('❌ خطأ في بناء التطبيق');
  process.exit(1);
}

console.log('⚙️ [2/8] إعداد ملف التكوين...');
// إنشاء package.json مخصص للـ exe
const pkgConfig = {
  "name": "taskflow-server",
  "version": "1.0.0",
  "description": "TaskFlow - نظام إدارة المهام والفرق",
  "main": "dist/index.js",
  "type": "module",
  "bin": "dist/index.js",
  "pkg": {
    "scripts": [
      "dist/**/*.js"
    ],
    "assets": [
      "client/dist/**/*",
      "node_modules/@neondatabase/**/*",
      "node_modules/whatsapp-web.js/**/*",
      "node_modules/qrcode/**/*",
      "node_modules/express/**/*",
      "node_modules/drizzle-orm/**/*"
    ],
    "targets": [
      "node18-win-x64"
    ]
  }
};

fs.writeFileSync('package-standalone.json', JSON.stringify(pkgConfig, null, 2));

console.log('🏗️ [3/8] إنشاء الملف التنفيذي...');
try {
  execSync('npx pkg . --config package-standalone.json --output TaskFlow-Standalone/TaskFlow.exe', { stdio: 'inherit' });
  console.log('✅ تم إنشاء الملف التنفيذي');
} catch (error) {
  console.error('❌ خطأ في إنشاء الملف التنفيذي');
  process.exit(1);
}

console.log('📁 [4/8] نسخ الملفات الضرورية...');
// نسخ ملفات الواجهة الأمامية
if (fs.existsSync('client/dist')) {
  execSync('xcopy client\\dist TaskFlow-Standalone\\client\\dist /E /I /Y /Q', { stdio: 'inherit' });
}

// نسخ ملفات الإعداد
if (fs.existsSync('.env.example')) {
  fs.copyFileSync('.env.example', 'TaskFlow-Standalone/.env.example');
}

console.log('⚡ [5/8] إنشاء سكريپت التشغيل الذكي...');
const startScript = `@echo off
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

:: تشغيل التطبيق
TaskFlow.exe

echo.
echo [%time%] تم إيقاف خادم TaskFlow
echo اضغط أي مفتاح للإغلاق...
pause`;

fs.writeFileSync('TaskFlow-Standalone/تشغيل TaskFlow.bat', startScript);

console.log('🔧 [6/8] إنشاء أدوات الإدارة...');
// سكريپت إعداد قاعدة البيانات
const dbSetupScript = `@echo off
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
pause`;

fs.writeFileSync('TaskFlow-Standalone/إعداد قاعدة البيانات.bat', dbSetupScript);

// سكريپت التثبيت كخدمة ويندوز
const serviceScript = `@echo off
chcp 65001 >nul
title تثبيت TaskFlow كخدمة ويندوز
color 0E

echo ===============================================
echo      تثبيت TaskFlow كخدمة ويندوز
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo هذا السكريپت سيثبت TaskFlow كخدمة ويندوز
echo بحيث يعمل تلقائياً عند بدء تشغيل الخادم
echo.

:: التحقق من صلاحيات المدير
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ يجب تشغيل هذا السكريپت كمدير
    echo اضغط بالزر الأيمن واختر "تشغيل كمدير"
    pause
    exit /b 1
)

echo [1/4] تثبيت PM2 عالمياً...
call npm install -g pm2 pm2-windows-service

echo [2/4] إعداد PM2 كخدمة ويندوز...
call pm2-service-install -n PM2

echo [3/4] إضافة TaskFlow لـ PM2...
call pm2 start "تشغيل TaskFlow.bat" --name TaskFlow

echo [4/4] حفظ إعدادات PM2...
call pm2 save

echo.
echo ===============================================
echo        تم تثبيت TaskFlow كخدمة ويندوز!
echo ===============================================
echo.
echo أوامر إدارة الخدمة:
echo pm2 list          - عرض حالة الخدمات
echo pm2 restart TaskFlow - إعادة تشغيل TaskFlow
echo pm2 stop TaskFlow     - إيقاف TaskFlow
echo pm2 logs TaskFlow     - عرض سجلات TaskFlow
echo.
pause`;

fs.writeFileSync('TaskFlow-Standalone/تثبيت كخدمة ويندوز.bat', serviceScript);

console.log('📚 [7/8] إنشاء الوثائق...');
// دليل المستخدم الشامل
const userGuide = `# TaskFlow - دليل المستخدم الشامل
شركة اشراق الودق لتكنولوجيا المعلومات

## نظرة عامة
TaskFlow هو نظام شامل لإدارة المهام والفرق يتضمن:
- إدارة المهام والمشاريع
- نظام المراسلة الفوري
- تقييم رضا العملاء عبر واتساب
- نظام النقاط والمكافآت
- إدارة علاقات العملاء مع GPS
- واجهة عربية كاملة

## متطلبات النظام
- Windows Server 2016 أو أحدث
- PostgreSQL 12 أو أحدث
- 4 GB RAM (8 GB مُوصى به)
- 2 GB مساحة حرة

## التثبيت السريع (بنقرة واحدة)

### الطريقة الأولى: التشغيل المباشر
1. شغل "إعداد قاعدة البيانات.bat" (مرة واحدة فقط)
2. شغل "تشغيل TaskFlow.bat"

### الطريقة الثانية: كخدمة ويندوز
1. شغل "إعداد قاعدة البيانات.bat" (مرة واحدة فقط)  
2. شغل "تثبيت كخدمة ويندوز.bat" كمدير

## الوصول إلى التطبيق
- الرابط المحلي: http://localhost:5000
- الرابط على الشبكة: http://[اسم-الخادم]:5000

## بيانات تسجيل الدخول الافتراضية
- اسم المستخدم: administrator
- كلمة المرور: wdq@#$

⚠️ مهم: غير كلمة المرور فور تسجيل الدخول

## الميزات الرئيسية

### 1. إدارة المهام
- إنشاء وتعديل المهام
- تتبع التقدم والحالة
- تعيين المهام للفريق
- نظام الأولويات

### 2. إدارة الفريق  
- ثلاث مستويات صلاحيات: مدير، مشرف، مستخدم
- نظام الموافقة على المستخدمين
- إدارة الأدوار والصلاحيات

### 3. نظام المراسلة
- مراسلة فورية بين أعضاء الفريق
- إشعارات تلقائية للمهام الجديدة
- سجل شامل للمحادثات

### 4. تقييم رضا العملاء
- إرسال تلقائي عبر واتساب عند إنجاز المهام
- ثلاث مستويات تقييم
- تقارير شاملة للرضا

### 5. نظام النقاط والمكافآت
- نقاط تلقائية عند إنجاز المهام
- لوحة المتصدرين
- نظام المكافآت

## إعدادات قاعدة البيانات

### إعداد PostgreSQL:
1. ثبت PostgreSQL من الموقع الرسمي
2. أنشئ قاعدة بيانات: taskflow_db
3. عدل ملف .env:

\`\`\`
DATABASE_URL=postgresql://postgres:كلمة_المرور@localhost:5432/taskflow_db
SESSION_SECRET=مفتاح_سري_عشوائي_طويل
NODE_ENV=production  
PORT=5000
\`\`\`

## إعدادات الأمان

### Windows Firewall:
- سيتم فتح المنفذ 5000 تلقائياً
- للفتح اليدوي: Windows Firewall > Inbound Rules > New Rule

### أمان قاعدة البيانات:
- استخدم كلمة مرور قوية لـ PostgreSQL
- فعّل التشفير في الاتصالات
- اعمل نسخ احتياطية دورية

## استكشاف الأخطاء

### مشكلة: التطبيق لا يعمل
- تأكد من تشغيل PostgreSQL
- تحقق من صحة إعدادات .env
- تأكد من فتح المنفذ 5000

### مشكلة: لا يمكن الوصول من الشبكة
- تحقق من إعدادات Windows Firewall
- تأكد من إعدادات الشبكة

### مشكلة: خطأ في قاعدة البيانات
- تحقق من كلمة مرور PostgreSQL
- تأكد من وجود قاعدة البيانات taskflow_db

## النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات:
\`\`\`cmd
pg_dump -U postgres -h localhost taskflow_db > backup.sql
\`\`\`

### استعادة النسخة الاحتياطية:
\`\`\`cmd  
psql -U postgres -h localhost -d taskflow_db < backup.sql
\`\`\`

## الصيانة

### تحديث التطبيق:
1. أوقف التطبيق
2. استبدل الملفات الجديدة
3. أعد تشغيل التطبيق

### مراقبة الأداء:
- راقب استخدام الذاكرة والمعالج
- تحقق من مساحة القرص الصلب
- راجع سجلات النظام بانتظام

## الدعم الفني
للحصول على الدعم الفني:
- راجع ملف "حل المشاكل.txt"
- تحقق من سجلات النظام
- اتصل بفريق الدعم

## رقم الإصدار
الإصدار: 1.0.0
تاريخ البناء: ${new Date().toLocaleDateString('ar-SA')}

---
جميع الحقوق محفوظة - شركة اشراق الودق لتكنولوجيا المعلومات`;

fs.writeFileSync('TaskFlow-Standalone/دليل المستخدم.txt', userGuide);

// ملف حل المشاكل
const troubleshooting = `# TaskFlow - حل المشاكل الشائعة

## مشاكل التشغيل

### المشكلة: "التطبيق لا يبدأ"
الحلول:
1. تأكد من وجود ملف .env
2. تحقق من إعدادات قاعدة البيانات
3. تأكد من تشغيل PostgreSQL
4. شغل كمدير

### المشكلة: "Port 5000 is already in use"  
الحلول:
1. غير المنفذ في ملف .env (PORT=3000)
2. أوقف التطبيق الآخر الذي يستخدم المنفذ
3. أعد تشغيل Windows Server

### المشكلة: "Cannot connect to database"
الحلول:
1. تأكد من تشغيل PostgreSQL
2. تحقق من كلمة المرور في .env
3. تأكد من وجود قاعدة البيانات taskflow_db
4. تحقق من إعدادات PostgreSQL

## مشاكل الشبكة

### المشكلة: "لا يمكن الوصول من أجهزة أخرى"
الحلول:
1. تحقق من Windows Firewall
2. تأكد من فتح المنفذ 5000
3. تحقق من إعدادات الشبكة المحلية
4. استخدم الرابط: http://[اسم-الخادم]:5000

### المشكلة: "بطء في التطبيق"
الحلول:
1. تحقق من استخدام الذاكرة
2. راقب استخدام المعالج
3. تحقق من مساحة القرص الصلب
4. أعد تشغيل التطبيق

## مشاكل قاعدة البيانات

### المشكلة: "Database connection failed"
الحلول:
1. تحقق من خدمة PostgreSQL
2. تأكد من صحة DATABASE_URL في .env
3. تحقق من صلاحيات المستخدم postgres
4. أعد تشغيل PostgreSQL

### المشكلة: "Table does not exist"
الحلول:
1. تأكد من إعداد قاعدة البيانات بشكل صحيح
2. تحقق من إنشاء الجداول المطلوبة
3. راجع سجلات التطبيق

## مشاكل تسجيل الدخول

### المشكلة: "بيانات تسجيل الدخول خاطئة"
الحلول:
1. استخدم: administrator / wdq@#$
2. تأكد من عدم وجود مسافات زائدة
3. تحقق من حالة الأحرف (Case Sensitive)

### المشكلة: "نسيان كلمة المرور"
الحلول:
1. استخدم الحساب الافتراضي: administrator
2. راجع إعدادات قاعدة البيانات
3. أعد إنشاء الحساب الإداري

## أوامر مفيدة

### فحص حالة PostgreSQL:
\`\`\`cmd
net start postgresql*
\`\`\`

### إعادة تشغيل PostgreSQL:
\`\`\`cmd  
net stop postgresql*
net start postgresql*
\`\`\`

### فحص المنافذ المستخدمة:
\`\`\`cmd
netstat -an | findstr :5000
\`\`\`

### فتح المنفذ في Windows Firewall:
\`\`\`cmd
netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=5000
\`\`\`

## سجلات النظام

### عرض سجلات التطبيق:
- تحقق من نافذة Command Prompt
- راجع Event Viewer في Windows
- افحص سجلات PostgreSQL

### أماكن ملفات السجلات:
- PostgreSQL: C:\\Program Files\\PostgreSQL\\[version]\\data\\log
- Windows Event Logs: Event Viewer > Application

## نصائح للأداء

### تحسين PostgreSQL:
1. زيد shared_buffers في postgresql.conf
2. اضبط effective_cache_size
3. فعّل checkpoint_completion_target

### تحسين Windows Server:
1. فعّل High Performance power plan
2. قلل من الخدمات غير المطلوبة
3. راقب استخدام الموارد

## نسخ احتياطية طارئة

### حفظ إعدادات التطبيق:
\`\`\`cmd
copy .env backup-env.txt
\`\`\`

### نسخ احتياطي سريع لقاعدة البيانات:
\`\`\`cmd
pg_dump -U postgres taskflow_db > emergency-backup.sql
\`\`\`

---
إذا لم تحل هذه الحلول مشكلتك، اتصل بفريق الدعم الفني`;

fs.writeFileSync('TaskFlow-Standalone/حل المشاكل.txt', troubleshooting);

console.log('📋 [8/8] إنشاء ملف المعلومات النهائي...');
// ملف معلومات النظام
const systemInfo = `TaskFlow - نظام إدارة المهام والفرق
شركة اشراق الودق لتكنولوجيا المعلومات

===============================================
              معلومات الإصدار
===============================================

الاسم: TaskFlow Server
الإصدار: 1.0.0 - الإصدار الشامل
النوع: تطبيق مستقل (Standalone)
النظام: Windows Server
تاريخ البناء: ${new Date().toLocaleDateString('ar-SA')}

===============================================
                المحتويات
===============================================

📁 الملفات الرئيسية:
  ⚡ TaskFlow.exe - الملف التنفيذي الرئيسي
  🚀 تشغيل TaskFlow.bat - سكريپت التشغيل الذكي
  🔧 إعداد قاعدة البيانات.bat - إعداد PostgreSQL
  🔄 تثبيت كخدمة ويندوز.bat - تثبيت كخدمة

📁 ملفات الإعداد:
  ⚙️ .env.example - قالب إعدادات النظام
  📝 .env - إعدادات النظام (سيتم إنشاؤه)

📁 الوثائق:
  📖 دليل المستخدم.txt - دليل شامل للاستخدام
  🆘 حل المشاكل.txt - حلول للمشاكل الشائعة
  ℹ️ معلومات النظام.txt - هذا الملف

===============================================
              التشغيل السريع
===============================================

للمرة الأولى:
1. شغل "إعداد قاعدة البيانات.bat"
2. شغل "تشغيل TaskFlow.bat"

للاستخدام اليومي:
- شغل "تشغيل TaskFlow.bat"

كخدمة ويندوز:
- شغل "تثبيت كخدمة ويندوز.bat" (كمدير)

===============================================
              معلومات الوصول
===============================================

الرابط المحلي: http://localhost:5000
الرابط على الشبكة: http://[اسم-الخادم]:5000

بيانات الدخول الافتراضية:
اسم المستخدم: administrator
كلمة المرور: wdq@#$

===============================================
               متطلبات النظام
===============================================

✅ Windows Server 2016 أو أحدث
✅ PostgreSQL 12 أو أحدث  
✅ 4 GB RAM (8 GB مُوصى به)
✅ 2 GB مساحة حرة
✅ إنترنت (للواتساب)

===============================================
                الميزات المتضمنة
===============================================

✅ إدارة المهام والمشاريع
✅ نظام الفرق ثلاثي المستويات
✅ مراسلة فورية
✅ إشعارات تلقائية
✅ تقييم رضا العملاء (واتساب)
✅ نظام النقاط والمكافآت
✅ إدارة علاقات العملاء مع GPS
✅ واجهة عربية كاملة
✅ تقارير شاملة
✅ نظام السجلات
✅ إدارة الملفات الشخصية

===============================================
                 الأمان
===============================================

🔒 تشفير كلمات المرور
🔒 جلسات آمنة
🔒 صلاحيات متدرجة
🔒 سجلات شاملة لجميع العمليات
🔒 نسخ احتياطية تلقائية

===============================================
                الدعم الفني
===============================================

📞 للدعم الفني: راجع "حل المشاكل.txt"
📧 للاستفسارات: راجع "دليل المستخدم.txt"
🔧 للصيانة: راجع الوثائق المرفقة

===============================================
              ملاحظات مهمة
===============================================

⚠️ غير كلمة المرور الافتراضية فور التشغيل
⚠️ اعمل نسخة احتياطية من قاعدة البيانات دورياً
⚠️ راقب سجلات النظام بانتظام
⚠️ حدث التطبيق عند توفر إصدارات جديدة

===============================================

جميع الحقوق محفوظة
شركة اشراق الودق لتكنولوجيا المعلومات
${new Date().getFullYear()}`;

fs.writeFileSync('TaskFlow-Standalone/معلومات النظام.txt', systemInfo);

// تنظيف الملفات المؤقتة
if (fs.existsSync('package-standalone.json')) {
  fs.unlinkSync('package-standalone.json');
}

console.log('✅ تم إنشاء TaskFlow الشامل بنجاح!');
console.log('');
console.log('===============================================');
console.log('📁 مجلد التطبيق الشامل: TaskFlow-Standalone/');
console.log('⚡ الملف التنفيذي: TaskFlow.exe');
console.log('🚀 للتشغيل: تشغيل TaskFlow.bat');
console.log('🔧 للإعداد: إعداد قاعدة البيانات.bat');
console.log('===============================================');