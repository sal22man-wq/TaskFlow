# دليل تنصيب TaskFlow على Windows Server

## المتطلبات الأساسية

### تحميل البرامج:
1. **Node.js 18.x أو أحدث**: https://nodejs.org/en/download/
2. **PostgreSQL 15**: https://www.postgresql.org/download/windows/
3. **Git for Windows**: https://git-scm.com/download/win
4. **Visual Studio Build Tools**: https://visualstudio.microsoft.com/downloads/

### خطوة 1: تنصيب Node.js
```cmd
# تحميل Node.js من الموقع الرسمي
# تأكد من اختيار "Add to PATH" أثناء التنصيب
# التحقق من التنصيب:
node --version
npm --version
```

### خطوة 2: تنصيب PostgreSQL
```cmd
# أثناء التنصيب اختر:
# - Password: اختر كلمة مرور قوية
# - Port: 5432 (الافتراضي)
# - Locale: Default

# إنشاء قاعدة البيانات:
# افتح pgAdmin أو Command Prompt
psql -U postgres

CREATE DATABASE taskflow;
CREATE USER taskflow_user WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE taskflow TO taskflow_user;
\q
```

### خطوة 3: تحضير مجلد المشروع
```cmd
# إنشاء مجلد في الدرايف الذي به المساحة الفارغة
mkdir C:\TaskFlow
cd C:\TaskFlow

# إذا كانت المساحة في درايف آخر:
mkdir D:\TaskFlow
cd D:\TaskFlow
```

### خطوة 4: تحميل المشروع
```cmd
# إذا كان لديك Git:
git clone YOUR_REPO_URL .

# أو تحميل ملف ZIP ثم:
# فك الضغط إلى مجلد TaskFlow
```

### خطوة 5: إعداد المتغيرات البيئية
```cmd
# إنشاء ملف .env
echo DATABASE_URL=postgresql://taskflow_user:YourStrongPassword123!@localhost:5432/taskflow > .env
echo SESSION_SECRET=your-super-secret-key-here >> .env
echo NODE_ENV=production >> .env
echo PORT=5000 >> .env
echo WHATSAPP_SIMULATION=true >> .env
```

### خطوة 6: تنصيب المكتبات
```cmd
# تنصيب npm packages (قد يأخذ وقت)
npm install

# إذا واجهت مشاكل، استخدم:
npm install --force

# أو:
npm install --legacy-peer-deps
```

### خطوة 7: تشغيل قاعدة البيانات
```cmd
# إنشاء الجداول
npm run db:push
```

### خطوة 8: تشغيل التطبيق
```cmd
# تشغيل للتطوير:
npm run dev

# أو للإنتاج:
npm run build
npm start
```

## حل مشاكل Windows Server الشائعة

### مشكلة Python/Visual Studio:
```cmd
# تنصيب Windows Build Tools:
npm install -g windows-build-tools

# أو تنصيب Visual Studio Build Tools يدوياً
```

### مشكلة node-gyp:
```cmd
npm install -g node-gyp
npm config set python python2.7
npm config set msvs_version 2019
```

### مشكلة bcrypt:
```cmd
# إذا فشل تنصيب bcrypt:
npm uninstall bcrypt
npm install bcryptjs

# ثم غيّر في الكود:
# من: import bcrypt from 'bcrypt'
# إلى: import bcrypt from 'bcryptjs'
```

### مشكلة whatsapp-web.js:
```cmd
# تنصيب Chromium بشكل منفصل:
npx puppeteer browsers install chrome

# أو استخدم النسخة المدمجة:
npm install whatsapp-web.js@legacy
```

## تشغيل التطبيق كخدمة Windows

### استخدام PM2:
```cmd
# تنصيب PM2
npm install -g pm2
npm install -g pm2-windows-startup

# تكوين PM2 للتشغيل مع Windows
pm2-startup install

# تشغيل التطبيق
pm2 start ecosystem.config.js
pm2 save
```

### أو استخدام NSSM:
```cmd
# تحميل NSSM: https://nssm.cc/download
# تنصيب الخدمة:
nssm install TaskFlow "C:\Program Files\nodejs\node.exe"
nssm set TaskFlow Parameters "C:\TaskFlow\server\index.js"
nssm set TaskFlow AppDirectory "C:\TaskFlow"
nssm start TaskFlow
```

## إعدادات الشبكة والأمان

### فتح البورت في Windows Firewall:
```cmd
# فتح البورت 5000
netsh advfirewall firewall add rule name="TaskFlow App" dir=in action=allow protocol=TCP localport=5000
```

### إعداد IIS (اختياري):
```cmd
# تنصيب IIS URL Rewrite Module
# تنصيب iisnode

# إنشاء web.config:
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server/index.js\/debug[\/]?" />
        </rule>
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

## نصائح لتوفير المساحة

### تنظيف node_modules:
```cmd
# بعد التنصيب، احذف ملفات التطوير:
npm prune --production

# أو استخدم:
npx clean-modules
```

### ضغط الملفات:
```cmd
# ضغط المجلد بعد التنصيب
compact /c /s C:\TaskFlow
```

## مراقبة الأداء

### فحص استخدام الموارد:
```cmd
# مراقبة الذاكرة:
tasklist /FI "IMAGENAME eq node.exe"

# مراقبة المعالج:
wmic cpu get loadpercentage /value
```

### تسجيل الأخطاء:
```cmd
# إنشاء مجلد اللوجز:
mkdir C:\TaskFlow\logs

# إعداد Windows Event Log:
eventcreate /T INFORMATION /ID 1000 /L APPLICATION /SO TaskFlow /D "Application Started"
```

## النسخ الاحتياطية

### نسخ احتياطية لقاعدة البيانات:
```cmd
# إنشاء نسخة احتياطية يومية:
pg_dump -U taskflow_user taskflow > C:\TaskFlow\backups\taskflow_%date%.sql
```

### نسخ احتياطية للملفات:
```cmd
# نسخ كامل للمجلد:
xcopy C:\TaskFlow D:\Backups\TaskFlow_%date% /E /I /H /Y
```

## الصيانة الدورية

### تنظيف أسبوعي:
```cmd
# تنظيف اللوجز القديمة:
forfiles /p C:\TaskFlow\logs /s /m *.log /d -7 /c "cmd /c del @path"

# تحديث المكتبات:
npm update

# إعادة تشغيل الخدمة:
pm2 restart TaskFlow
```

## استكشاف الأخطاء

### إذا لم يعمل التطبيق:
1. تحقق من تشغيل PostgreSQL: `services.msc`
2. تحقق من البورت: `netstat -an | find "5000"`
3. راجع اللوجز: `pm2 logs TaskFlow`
4. تحقق من المتغيرات البيئية: `set | find "DATABASE"`

### إذا كان بطيئاً:
1. زيد الذاكرة المخصصة: `pm2 restart TaskFlow --max-memory-restart 1000M`
2. استخدم SSD إذا أمكن
3. أغلق البرامج غير الضرورية

---

**ملاحظة**: Windows Server قد يكون صعباً مع Node.js، لكن مع الصبر والمثابرة ممكن ينجح! المهم تتبع التعليمات خطوة بخطوة.