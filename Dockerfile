# ========================
# Stage 1: Build
# ========================
FROM node:18-alpine AS builder

# تعيين مجلد العمل
WORKDIR /app

# نسخ package.json + lock
COPY package*.json ./

# ننصب كل البكجات (dependencies + devDependencies)
RUN npm install

# نسخ باقي الملفات
COPY . .

# تشغيل build (يسوي dist/)
RUN npm run build

# ========================
# Stage 2: Production
# ========================
FROM node:18-alpine

WORKDIR /app

# نسخ فقط ملفات البكجات
COPY package*.json ./

# نصب فقط production dependencies
RUN npm install --only=production

# نسخ الملفات المبنية من الستيج الأول
COPY --from=builder /app/dist ./dist

# نسخ أي ملفات ثابتة تحتاجها (مثلاً public/uploads/...)
COPY --from=builder /app/public ./public

# إنشاء مجلدات مستخدمة
RUN mkdir -p whatsapp-sessions uploads logs

# البورت
EXPOSE 3000

# أمر التشغيل
CMD ["npm", "start"]
