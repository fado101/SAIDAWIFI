# استخدام Node.js 18 كصورة أساسية
FROM node:18-alpine

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات فقط للإنتاج
RUN npm ci --only=production

# نسخ جميع ملفات التطبيق
COPY . .

# بناء التطبيق
RUN npm run build

# إنشاء مستخدم غير مميز لتشغيل التطبيق
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# تغيير ملكية ملفات التطبيق
RUN chown -R nextjs:nodejs /app
USER nextjs

# تعيين متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=5000

# كشف المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["npm", "start"]