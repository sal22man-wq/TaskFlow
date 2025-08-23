# دليل نقل التطبيق من Replit

## متطلبات النظام

### المكتبات الأساسية:
- **Node.js**: الإصدار 18 أو أحدث
- **PostgreSQL**: قاعدة بيانات
- **npm**: مدير الحزم

### المتغيرات البيئية المطلوبة:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/taskflow
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
PORT=5000

# WhatsApp Integration (اختياري)
WHATSAPP_SESSION_PATH=/path/to/sessions
WHATSAPP_SIMULATION=false

# Object Storage (اختياري للصور)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/bucket/public
PRIVATE_OBJECT_DIR=/bucket/private
```

## خطوات النقل

### 1. تحضير الملفات للنقل
```bash
# إنشاء أرشيف للمشروع
zip -r taskflow-export.zip . -x "node_modules/*" ".git/*" ".replit*" "*.log"
```

### 2. إعداد الخادم الجديد

#### على Ubuntu/Linux:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تنصيب Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تنصيب PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# تنصيب PM2 لإدارة التطبيق
sudo npm install -g pm2
```

#### إعداد قاعدة البيانات:
```bash
sudo -u postgres psql
CREATE DATABASE taskflow;
CREATE USER taskflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow TO taskflow_user;
\q
```

### 3. نقل البيانات من Replit

#### تصدير البيانات:
استخدم API endpoint الموجود في التطبيق:
```
GET /api/admin/export-data
```
هذا سيعطيك ملف ZIP يحتوي على:
- جميع المستخدمين
- جميع المهام
- أعضاء الفريق
- الرسائل والإشعارات
- تقييمات العملاء

#### استيراد البيانات:
```bash
# فك ضغط الملفات
unzip taskflow-export.zip
cd taskflow-export

# تنصيب المكتبات
npm install

# تشغيل migrations
npm run db:push

# استيراد البيانات (إذا توفر سكريبت)
node scripts/import-data.js
```

### 4. إعداد الخدمة للتشغيل المستمر

#### إنشاء ملف PM2:
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'taskflow',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

#### تشغيل التطبيق:
```bash
# بناء المشروع
npm run build

# تشغيل بـ PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 5. إعداد Nginx (اختياري)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## منصات الاستضافة المُوصى بها

### 1. **DigitalOcean (الأفضل للتكلفة)**
- **التكلفة**: $5-12/شهر
- **المزايا**: سهولة الإعداد، دعم فني ممتاز
- **السلبيات**: تحتاج إدارة يدوية

### 2. **AWS EC2**
- **التكلفة**: $10-30/شهر
- **المزايا**: مرونة عالية، خدمات متقدمة
- **السلبيات**: معقد للمبتدئين

### 3. **Google Cloud Platform**
- **التكلفة**: $8-25/شهر
- **المزايا**: أداء عالي، تكامل جيد
- **السلبيات**: واجهة معقدة

### 4. **Vultr**
- **التكلفة**: $3.5-10/شهر
- **المزايا**: رخيص، أداء جيد
- **السلبيات**: دعم فني محدود

## حل مشاكل الواتساب

### المشاكل الشائعة:
1. **مشكلة QR Code**: استخدام المتصفح headless
2. **انقطاع الاتصال**: إعداد auto-reconnect
3. **حظر الرقم**: استخدام أرقام متعددة

### البدائل:
1. **WhatsApp Business API**: أكثر استقراراً لكن مكلف
2. **Twilio**: API للرسائل النصية
3. **Telegram Bot**: بديل مجاني

## الدعم الفني
- تحقق من logs: `pm2 logs taskflow`
- مراقبة الأداء: `pm2 monit`
- إعادة التشغيل: `pm2 restart taskflow`

## ملاحظات مهمة
- احتفظ بنسخ احتياطية دورية من قاعدة البيانات
- استخدم HTTPS في البيئة الإنتاجية
- راقب استخدام الذاكرة والمعالج
- قم بتحديث المكتبات بانتظام لأسباب الأمان