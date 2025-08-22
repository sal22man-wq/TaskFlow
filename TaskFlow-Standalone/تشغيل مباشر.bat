@echo off
chcp 65001 >nul
title TaskFlow - تشغيل مباشر
color 0C

echo ===============================================
echo           TaskFlow - تشغيل مباشر
echo      شركة اشراق الودق لتكنولوجيا المعلومات
echo ===============================================
echo.

echo تحذير: هذا التشغيل المباشر للملف التنفيذي
echo بدون إعدادات إضافية
echo.

:: تعيين متغيرات البيئة الأساسية
set NODE_ENV=production
set PORT=5000

echo تشغيل TaskFlow.exe...
echo الرابط: http://localhost:5000
echo.

TaskFlow.exe

pause