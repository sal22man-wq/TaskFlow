# TaskFlow - دليل التنصيب السريع على Windows Server

## 🚀 البدء السريع (3 خطوات فقط):

### 1. تحميل المتطلبات:
- **Node.js 18+**: https://nodejs.org/en/download/
- **PostgreSQL 15+**: https://www.postgresql.org/download/windows/

### 2. إعداد قاعدة البيانات:
```sql
-- افتح pgAdmin أو psql وشغل:
CREATE DATABASE taskflow;
CREATE USER taskflow_user WITH PASSWORD 'YourPassword123';
GRANT ALL PRIVILEGES ON DATABASE taskflow TO taskflow_user;
```

### 3. تشغيل التطبيق:
```cmd
# فك الضغط عن الملفات
# افتح Command Prompt في مجلد المشروع
# شغل الملف التالي:
quick-setup.bat
```

## 📁 الملفات المهمة:

| الملف | الوصف |
|-------|--------|
| `quick-setup.bat` | **ابدأ من هنا!** - إعداد تلقائي كامل |
| `WINDOWS_SERVER_SETUP.md` | دليل تفصيلي لحل المشاكل |
| `DEPLOYMENT_GUIDE.md` | دليل شامل لجميع المنصات |
| `docker-compose.yml` | تشغيل بـ Docker (بديل أسهل) |

## 🐛 إذا واجهت مشاكل:

### مشكلة تنصيب المكتبات:
```cmd
npm install --legacy-peer-deps --force
```

### مشكلة Python/Visual Studio:
```cmd
npm install -g windows-build-tools
```

### مشكلة قاعدة البيانات:
- تأكد من تشغيل PostgreSQL Service
- راجع كلمة المرور في ملف `.env`

## 🔧 استخدام Docker (بديل أسهل):

إذا كان لديك Docker Desktop:
```cmd
docker-compose up -d
```

## 📞 المساعدة:

1. **للمشاكل العامة**: راجع `WINDOWS_SERVER_SETUP.md`
2. **للنشر**: راجع `DEPLOYMENT_GUIDE.md`  
3. **للبدائل**: راجع `EXPORT_INSTRUCTIONS.md`

---

**ملاحظة**: إذا كنت تستخدم Windows Server 2016 أو أقدم، قد تحتاج تحديثات إضافية.