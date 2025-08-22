# دليل التشغيل السريع لـ TaskFlow على ويندوز سيرفر

## ✅ الخطوات المطلوبة بالترتيب:

### 1. تثبيت المتطلبات الأساسية

#### تثبيت Node.js:
1. اذهب إلى https://nodejs.org/
2. حمل النسخة LTS (حالياً 18.x أو 20.x)
3. شغل الملف المحمل واتبع التعليمات
4. للتأكد من التثبيت، افتح Command Prompt وأكتب:
```cmd
node --version
npm --version
```

#### تثبيت PostgreSQL:
1. اذهب إلى https://www.postgresql.org/download/windows/
2. حمل PostgreSQL 14 أو أحدث
3. شغل الملف المحمل
4. أثناء التثبيت:
   - اختر كلمة مرور قوية للمستخدم postgres
   - اتركPorts الافتراضي (5432)
   - احفظ كلمة المرور في مكان آمن

### 2. إعداد قاعدة البيانات

1. افتح **pgAdmin** (يتم تثبيته مع PostgreSQL)
2. اتصل بالسيرفر المحلي باستخدام كلمة مرور postgres
3. انشئ قاعدة بيانات جديدة:
   - اضغط بالزر الأيمن على "Databases"
   - اختر "Create > Database"
   - اسم قاعدة البيانات: `taskflow_db`
   - اضغط Save

### 3. نسخ ملفات التطبيق

1. انسخ جميع ملفات المشروع إلى مجلد على السيرفر (مثال: `C:\TaskFlow\`)
2. تأكد من وجود جميع المجلدات:
   - client/
   - server/
   - shared/
   - package.json

### 4. تثبيت تبعيات التطبيق

1. افتح Command Prompt كمدير (Run as Administrator)
2. انتقل إلى مجلد التطبيق:
```cmd
cd C:\TaskFlow\
```
3. ثبت التبعيات:
```cmd
npm install
```

### 5. إعداد متغيرات البيئة

1. انسخ ملف `.env.example` إلى `.env`:
```cmd
copy .env.example .env
```
2. افتح ملف `.env` بأي محرر نصوص وعدل المتغيرات:
```env
DATABASE_URL=postgresql://postgres:كلمة_المرور_هنا@localhost:5432/taskflow_db
SESSION_SECRET=مفتاح_سري_عشوائي_طويل
NODE_ENV=production
PORT=5000
```

### 6. إعداد قاعدة البيانات الأولي

1. في نفس Command Prompt:
```cmd
npm run db:push
```
هذا الأمر سينشئ جميع الجداول المطلوبة في قاعدة البيانات.

### 7. بناء التطبيق

```cmd
npm run build
```

### 8. تشغيل التطبيق

#### للتشغيل العادي:
```cmd
npm start
```

#### للتشغيل مع إعادة التحميل التلقائي (أثناء التطوير):
```cmd
npm run dev
```

### 9. الوصول إلى التطبيق

1. افتح المتصفح
2. اذهب إلى: http://localhost:5000
3. بيانات تسجيل الدخول الافتراضية:
   - اسم المستخدم: `administrator`
   - كلمة المرور: `wdq@#$`

## 🔧 إعدادات إضافية (اختيارية)

### فتح المنفذ في Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "TaskFlow App" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
```

### تشغيل التطبيق كخدمة ويندوز:

1. ثبت PM2:
```cmd
npm install -g pm2
npm install -g pm2-windows-service
```

2. إعداد PM2 كخدمة:
```cmd
pm2-service-install
```

3. إضافة TaskFlow لـ PM2:
```cmd
pm2 start npm --name "TaskFlow" -- start
pm2 save
```

الآن سيعمل التطبيق تلقائياً عند إعادة تشغيل السيرفر.

## 🐛 حل المشاكل الشائعة

### مشكلة: "Port 5000 is already in use"
```cmd
# تغيير المنفذ في ملف .env
PORT=3000
```

### مشكلة: "Cannot connect to database"
- تأكد من تشغيل PostgreSQL
- تحقق من صحة كلمة المرور في ملف .env
- تأكد من اسم قاعدة البيانات

### مشكلة: صفحة فارغة في المتصفح
```cmd
# تأكد من بناء التطبيق
npm run build
```

### مشكلة: "npm command not found"
- تأكد من تثبيت Node.js بشكل صحيح
- أعد تشغيل Command Prompt

## 📋 أوامر مفيدة

```cmd
# مشاهدة حالة التطبيق
pm2 list

# مشاهدة السجلات
pm2 logs TaskFlow

# إعادة تشغيل التطبيق
pm2 restart TaskFlow

# إيقاف التطبيق
pm2 stop TaskFlow

# حذف التطبيق من PM2
pm2 delete TaskFlow
```

## 🎯 ملاحظات مهمة

1. **أمان**: غير كلمة المرور الافتراضية بعد أول تسجيل دخول
2. **النسخ الاحتياطي**: اعمل نسخة احتياطية من قاعدة البيانات بانتظام
3. **التحديثات**: تابع التحديثات الأمنية لـ Node.js و PostgreSQL
4. **المراقبة**: راقب استخدام الذاكرة والمعالج

## 📞 الدعم الفني

إذا واجهت أي مشاكل:
1. تحقق من السجلات في Command Prompt
2. تأكد من تشغيل جميع الخدمات المطلوبة
3. راجع ملف .env للتأكد من صحة الإعدادات

---
**نصيحة**: احفظ هذا الدليل في مكان يسهل الوصول إليه للرجوع إليه لاحقاً.