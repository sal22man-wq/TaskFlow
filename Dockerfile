# ========================
# Stage 1: Build
# ========================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# ========================
# Stage 2: Production
# ========================
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# إنشاء مجلدات مستخدمة
RUN mkdir -p whatsapp-sessions uploads logs

EXPOSE 3000

# نشغّل migrations أولاً ثم السيرفر
CMD ["sh", "-c", "npm run db:push && npm start"]
