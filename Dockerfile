# استخدام Node.js الإصدار 18 كقاعدة
FROM node:18-alpine

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تنصيب المكتبات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# إنشاء مجلدات للبيانات
RUN mkdir -p whatsapp-sessions uploads logs

# بناء التطبيق
RUN npm run build

# إنشاء مستخدم غير root للأمان
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# تغيير ملكية الملفات
RUN chown -R nextjs:nodejs /app
USER nextjs

# كشف البورت
EXPOSE 5000

# إضافة health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# تشغيل التطبيق
CMD ["npm", "start"]