@echo off
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
pause