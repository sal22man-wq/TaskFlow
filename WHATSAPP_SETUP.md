# دليل ربط الواتساب برقم المرسل

## نظرة عامة

يدعم النظام عدة طرق لربط الواتساب وإرسال تقييمات العملاء تلقائياً عند إكمال المهام.

## الطرق المتاحة

### 1. WhatsApp Business API (مُوصى للشركات)

**المتطلبات:**
- حساب WhatsApp Business
- موافقة من Meta (فيسبوك)
- رقم هاتف مخصص للأعمال

**خطوات الإعداد:**
1. التسجيل في [WhatsApp Business Platform](https://business.whatsapp.com/)
2. تقديم طلب للحصول على API
3. إضافة الرقم المعتمد في متغيرات البيئة:
   ```
   WHATSAPP_SENDER_NUMBER=966501234567
   WHATSAPP_ACCESS_TOKEN=your_access_token
   ```

**المميزات:**
- إرسال رسائل تجارية رسمية
- قوالب رسائل معتمدة
- إحصائيات مفصلة
- استقرار عالي

### 2. WhatsApp Web.js (للمشاريع الصغيرة)

**المتطلبات:**
- رقم واتساب شخصي أو تجاري
- مسح QR Code للربط

**خطوات الإعداد:**
1. تثبيت المكتبة:
   ```bash
   npm install whatsapp-web.js qrcode-terminal
   ```

2. إضافة الكود في `server/whatsapp-service.ts`:
   ```javascript
   import { Client, LocalAuth } from 'whatsapp-web.js';
   import qrcode from 'qrcode-terminal';

   const client = new Client({
     authStrategy: new LocalAuth()
   });

   client.on('qr', (qr) => {
     qrcode.generate(qr, { small: true });
   });

   client.on('ready', () => {
     console.log('WhatsApp connected!');
   });

   client.initialize();
   ```

**المميزات:**
- سهولة الإعداد
- مجاني
- يدعم جميع مميزات الواتساب

**العيوب:**
- قد يحتاج إعادة ربط
- مخالف لشروط الاستخدام التجاري

### 3. خدمات API خارجية

#### أ. Twilio WhatsApp API

```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+966${phoneNumber}`,
  body: 'رسالة التقييم...'
});
```

#### ب. MessageBird WhatsApp API

```javascript
const messagebird = require('messagebird')('your-access-key');

messagebird.conversations.start({
  to: phoneNumber,
  channelId: 'whatsapp-channel-id',
  type: 'text',
  content: { text: 'رسالة التقييم...' }
});
```

## إعداد متغيرات البيئة

أضف في ملف `.env`:

```env
# رقم المرسل
WHATSAPP_SENDER_NUMBER=966501234567

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# MessageBird
MESSAGEBIRD_ACCESS_KEY=your_access_key
```

## رسالة التقييم الافتراضية

```text
مرحباً {customerName}

✅ تم إتمام مهمة "{taskTitle}" بنجاح من قبل شركة اشراق الودق لتكنولوجيا المعلومات.

🌟 نرجو تقييم مستوى رضاكم عن أدائنا:

رد برقم واحد فقط:
1️⃣ - غاضب 😠
2️⃣ - راضي 😊  
3️⃣ - راضي جدا 😍

شكراً لثقتكم بنا 🙏
```

## تفعيل الربط

1. اختر الطريقة المناسبة لمشروعك
2. أضف متغيرات البيئة المطلوبة
3. عدل ملف `server/whatsapp-service.ts` حسب الطريقة المختارة
4. أعد تشغيل الخادم

## اختبار النظام

1. أكمل إحدى المهام (غير الحالة إلى "مكتملة")
2. تحقق من console logs للتأكد من إرسال الطلب
3. افحص صفحة تقييمات العملاء في لوحة الإدارة

## ملاحظات مهمة

- تأكد من صحة تنسيق أرقام الهواتف (966501234567)
- احفظ نسخة احتياطية من بيانات التوثيق
- راقب حدود الإرسال لتجنب الحظر
- استخدم القوالب المعتمدة للرسائل التجارية

## الدعم الفني

عند مواجهة مشاكل:
1. تحقق من صحة متغيرات البيئة
2. راجع console logs للأخطاء
3. تأكد من اتصال الإنترنت
4. تحقق من صلاحية التوكن/المفاتيح