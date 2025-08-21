# تشغيل المشروع خارج Replit

## سبب عدم عمل الواتساب في Replit
البيئة المجانية في Replit لها قيود صارمة على:
- الذاكرة (أقل من 512MB)
- معالجة العمليات الثقيلة
- تشغيل متصفح Puppeteer المطلوب للواتساب

## خطوات التشغيل المحلي

### 1. متطلبات النظام
```bash
- Node.js 18+ 
- PostgreSQL 12+
- ذاكرة متاحة 2GB+
- نظام تشغيل: Windows/Mac/Linux
```

### 2. التحضير
```bash
# تحميل المشروع (إذا من GitHub)
git clone YOUR_REPO_URL
cd taskflow

# أو فك ضغط ملف ZIP المُصدَّر من Replit
```

### 3. تثبيت المكتبات
```bash
npm install
```

### 4. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات PostgreSQL جديدة
createdb taskflow

# نسخ إعدادات البيئة
cp .env.example .env

# تعديل .env بمعلومات قاعدة البيانات الصحيحة
# DATABASE_URL="postgresql://username:password@localhost:5432/taskflow"
```

### 5. إعداد قاعدة البيانات
```bash
npm run db:push
```

### 6. تشغيل المشروع
```bash
# للتطوير
npm run dev

# للإنتاج
npm run build
npm start
```

### 7. اختبار الواتساب
- اذهب للإعدادات المتقدمة
- فعل الواتساب الحقيقي
- امسح رمز QR
- يجب أن يعمل بشكل طبيعي!

## نشر على خادم سحابي

### Railway (مجاني)
1. اربط GitHub مع Railway
2. انشر المشروع مباشرة
3. أضف متغيرات البيئة
4. سيعمل الواتساب تلقائياً

### Render (مجاني)
1. اربط GitHub مع Render
2. أضف Build Command: `npm install && npm run build`
3. أضف Start Command: `npm start`
4. أضف قاعدة بيانات PostgreSQL

### DigitalOcean ($4/شهر)
1. أنشئ Droplet جديد
2. ثبت Node.js وPostgreSQL
3. ارفع المشروع وشغله

## استكشاف الأخطاء

### مشكلة قاعدة البيانات
```bash
# تحقق من اتصال PostgreSQL
psql $DATABASE_URL

# إعادة إنشاء الجداول
npm run db:push --force
```

### مشكلة الواتساب
```bash
# تأكد من توفر الذاكرة الكافية
free -m

# إعادة تشغيل الخدمة
pm2 restart taskflow
```

## الفوائد خارج Replit
✅ الواتساب الحقيقي يعمل 100%
✅ أداء أسرع وأكثر استقراراً  
✅ ذاكرة وموارد أكبر
✅ تحكم كامل في البيئة
✅ لا توجد قيود على الاستخدام