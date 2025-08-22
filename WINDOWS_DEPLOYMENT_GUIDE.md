# دليل نشر TaskFlow على ويندوز سيرفر

## نظرة عامة
هذا الدليل يوضح كيفية تصدير وتشغيل تطبيق TaskFlow على ويندوز سيرفر بطرق مختلفة.

## الطرق المتاحة للنشر

### 1. تشغيل مباشر بـ Node.js (الأسهل)

#### المتطلبات:
- Windows Server 2016 أو أحدث
- Node.js 18+ 
- PostgreSQL 14+
- Git (اختياري)

#### خطوات التثبيت:

1. **تثبيت Node.js**
   ```powershell
   # تحميل من https://nodejs.org/
   # أو باستخدام Chocolatey
   choco install nodejs
   ```

2. **تثبيت PostgreSQL**
   ```powershell
   # تحميل من https://www.postgresql.org/download/windows/
   # أو باستخدام Chocolatey
   choco install postgresql
   ```

3. **نسخ ملفات المشروع**
   - نسخ جميع ملفات المشروع إلى مجلد على السيرفر (مثل `C:\TaskFlow\`)
   - أو استنساخ المشروع من Git

4. **تثبيت التبعيات**
   ```powershell
   cd C:\TaskFlow\
   npm install
   ```

5. **إعداد قاعدة البيانات**
   ```powershell
   # إنشاء قاعدة بيانات
   createdb taskflow_db
   
   # تعيين متغير البيئة
   $env:DATABASE_URL = "postgresql://username:password@localhost:5432/taskflow_db"
   
   # تشغيل المايجريشن
   npm run db:push
   ```

6. **تشغيل التطبيق**
   ```powershell
   npm run dev
   # أو للإنتاج
   npm run build
   npm start
   ```

### 2. إنشاء خدمة ويندوز (للتشغيل التلقائي)

#### استخدام PM2:

1. **تثبيت PM2**
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-service
   ```

2. **إعداد PM2 كخدمة**
   ```powershell
   pm2-service-install
   ```

3. **إضافة التطبيق لـ PM2**
   ```powershell
   cd C:\TaskFlow\
   pm2 start npm --name "TaskFlow" -- start
   pm2 save
   ```

#### استخدام NSSM (Non-Sucking Service Manager):

1. **تحميل NSSM**
   - من https://nssm.cc/download

2. **إنشاء الخدمة**
   ```powershell
   nssm install TaskFlow "C:\Program Files\nodejs\node.exe"
   nssm set TaskFlow AppParameters "C:\TaskFlow\server\index.js"
   nssm set TaskFlow AppDirectory "C:\TaskFlow"
   nssm start TaskFlow
   ```

### 3. استخدام Docker (الأكثر مرونة)

#### إنشاء Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### إنشاء docker-compose.yml:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/taskflow
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### تشغيل بـ Docker:
```powershell
docker-compose up -d
```

### 4. إنشاء ملف تنفيذي (Executable)

#### استخدام pkg:

1. **تثبيت pkg**
   ```powershell
   npm install -g pkg
   ```

2. **إعداد package.json**
   ```json
   {
     "pkg": {
       "targets": ["node18-win-x64"],
       "outputPath": "dist",
       "assets": [
         "client/dist/**/*",
         "node_modules/**/*"
       ]
     }
   }
   ```

3. **بناء الملف التنفيذي**
   ```powershell
   npm run build
   pkg . --output taskflow.exe
   ```

#### استخدام Nexe:

1. **تثبيت nexe**
   ```powershell
   npm install -g nexe
   ```

2. **بناء الملف التنفيذي**
   ```powershell
   nexe -i server/index.js -o taskflow.exe -t windows
   ```

## متغيرات البيئة المطلوبة

إنشاء ملف `.env` في المجلد الجذر:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/taskflow_db
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
PORT=5000
```

## إعداد قاعدة البيانات

### إنشاء قاعدة البيانات:
```sql
CREATE DATABASE taskflow_db;
CREATE USER taskflow_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow_user;
```

### تشغيل المايجريشن:
```powershell
npm run db:push
```

## إعداد الشبكة

### فتح المنافذ في Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "TaskFlow App" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
```

### إعداد IIS (اختياري):
```xml
<!-- web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server/index.js"/>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## مراقبة ونسخ احتياطي

### سكريبت النسخ الاحتياطي:
```powershell
# backup.ps1
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
pg_dump -h localhost -U taskflow_user taskflow_db > "backup_$date.sql"
```

### مراقبة التطبيق:
```powershell
# استخدام PM2
pm2 monit

# أو استخدام PowerShell
Get-Process -Name "node" | Select-Object Id, ProcessName, CPU, WorkingSet
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من تشغيل PostgreSQL
   - تحقق من صحة DATABASE_URL

2. **مشكلة في المنافذ**
   - تأكد من عدم استخدام المنفذ 5000
   - تحقق من إعدادات Firewall

3. **مشاكل الصلاحيات**
   - تشغيل PowerShell كمدير
   - تعديل صلاحيات المجلد

## الأمان

### إعدادات الأمان:
1. تغيير كلمات المرور الافتراضية
2. تفعيل SSL/HTTPS
3. تحديث النظام بانتظام
4. إعداد جدار حماية
5. مراقبة السجلات

## الصيانة

### تحديث التطبيق:
```powershell
# إيقاف التطبيق
pm2 stop TaskFlow

# تحديث الملفات
git pull origin main
npm install

# إعادة تشغيل
pm2 restart TaskFlow
```

### تنظيف السجلات:
```powershell
# تنظيف سجلات PM2
pm2 flush

# تنظيف سجلات Windows
wevtutil cl Application
```

## الدعم الفني

للحصول على المساعدة:
1. مراجعة سجلات الأخطاء
2. التحقق من حالة الخدمات
3. مراجعة إعدادات الشبكة
4. الاتصال بفريق الدعم الفني

---

**ملاحظة**: يُنصح باختبار جميع الخطوات في بيئة تطوير قبل النشر في الإنتاج.