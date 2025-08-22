const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 بناء ملف التنفيذي لـ TaskFlow...');

// التأكد من بناء التطبيق أولاً
console.log('📦 بناء التطبيق...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ تم بناء التطبيق بنجاح');
} catch (error) {
  console.error('❌ خطأ في بناء التطبيق:', error.message);
  process.exit(1);
}

// إنشاء ملف package.json مؤقت للـ exe
const exePackageJson = {
  "name": "taskflow-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "type": "module",
  "bin": "dist/index.js",
  "pkg": {
    "scripts": ["dist/**/*.js"],
    "assets": [
      "client/dist/**/*",
      "node_modules/@neondatabase/**/*",
      "node_modules/whatsapp-web.js/**/*"
    ],
    "targets": [
      "node18-win-x64"
    ],
    "outputPath": "build"
  },
  "dependencies": {
    "@neondatabase/serverless": "*",
    "express": "*",
    "whatsapp-web.js": "*"
  }
};

fs.writeFileSync('package-exe.json', JSON.stringify(exePackageJson, null, 2));

// إنشاء سكريپت التشغيل
const startScript = `
@echo off
title TaskFlow Server - Windows Server
color 0A

echo ===============================================
echo      TaskFlow Server - Standalone
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo [%time%] بدء تشغيل TaskFlow...

:: تعيين متغيرات البيئة
set NODE_ENV=production
set PORT=5000

:: فتح المنفذ في Windows Firewall
netsh advfirewall firewall add rule name="TaskFlow Application" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1

echo ✅ التطبيق جاهز على: http://localhost:5000
echo.
echo بيانات تسجيل الدخول:
echo اسم المستخدم: administrator
echo كلمة المرور: wdq@#$
echo.
echo اضغط Ctrl+C للإيقاف
echo ===============================================
echo.

:: تشغيل التطبيق
taskflow-server.exe

pause
`;

fs.writeFileSync('start-taskflow.bat', startScript);

console.log('🏗️ إنشاء الملف التنفيذي...');

try {
  // بناء الملف التنفيذي
  execSync('npx pkg . --config package-exe.json --out-path build', { stdio: 'inherit' });
  
  // نسخ الملفات المطلوبة
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }
  
  // نسخ ملفات الواجهة الأمامية
  if (fs.existsSync('client/dist')) {
    execSync('xcopy client\\dist build\\client\\dist /E /I /Y', { stdio: 'inherit' });
  }
  
  // نسخ ملفات الإعداد
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', 'build/.env.example');
  }
  
  // نسخ سكريپت التشغيل
  fs.copyFileSync('start-taskflow.bat', 'build/start-taskflow.bat');
  
  // إنشاء دليل التشغيل
  const readme = `
# TaskFlow - Windows Server

## تشغيل التطبيق:
1. تأكد من تثبيت PostgreSQL
2. انسخ .env.example إلى .env وعدل الإعدادات
3. شغل: start-taskflow.bat

## أو شغل مباشرة:
taskflow-server.exe

## الوصول:
http://localhost:5000

## بيانات الدخول:
- اسم المستخدم: administrator
- كلمة المرور: wdq@#$
`;
  
  fs.writeFileSync('build/README.txt', readme);
  
  console.log('✅ تم إنشاء الملف التنفيذي بنجاح!');
  console.log('📁 المجلد: build/');
  console.log('🚀 الملف التنفيذي: build/taskflow-server.exe');
  console.log('▶️ سكريپت التشغيل: build/start-taskflow.bat');
  
} catch (error) {
  console.error('❌ خطأ في إنشاء الملف التنفيذي:', error.message);
  process.exit(1);
} finally {
  // حذف الملفات المؤقتة
  if (fs.existsSync('package-exe.json')) {
    fs.unlinkSync('package-exe.json');
  }
}