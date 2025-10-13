# 🚀 دليل النشر - التطبيقات البديلة (تعمل من سوريا)

## 🆕 التحديثات الجديدة - إصدار محسن للشبكات السورية

**ميزات جديدة:**
- ✅ **API مباشر**: يتصل مباشرة مع سيرفر DMA (108.181.215.206)
- ✅ **تجاوز القيود**: لا يعتمد على سيرفرات وسطية محجوبة
- ✅ **كشف البيئة**: استخدام Direct API افتراضياً في جميع البيئات
- ✅ **نظام مصادقة محسن**: تحقق آمن ومباشر مع DMA
- ✅ **لوجو ثلاثي الأبعاد**: استخدام الصورة الأصلية بدلاً من CSS

**ملفات محدثة:**
- `client/src/lib/environmentDetector.ts` - كشف البيئة محسن
- `client/src/config/api.ts` - إعدادات API محدثة
- `client/src/services/directApiService.ts` - خدمة API مباشرة
- `client/src/services/authService.ts` - نظام مصادقة محدث

---

## 🌍 المنصات المدعومة (تعمل من سوريا)

### ✅ منصات موصى بها:

1. **Railway** - سهل ومجاني حتى 5$ شهرياً
2. **Vercel** - مجاني للمشاريع الصغيرة
3. **Netlify** - للتطبيقات الثابتة والديناميكية
4. **DigitalOcean App Platform** - مرن وموثوق
5. **Hostinger VPS** - استضافة عربية
6. **AWS Lightsail** - خوادم صغيرة بسعر ثابت

---

## 🚫 مشكلة Replit في سوريا

**السبب:** Replit يستضيف على Google Cloud Platform المحظور في سوريا بسبب العقوبات الأمريكية.
**الحل:** استخدام المنصات البديلة المذكورة أعلاه.

---

## 📦 1. النشر على Railway (الأسهل)

### الخطوات:
1. **إنشاء حساب:** اذهب إلى [railway.app](https://railway.app)
2. **رفع المشروع:** اربط GitHub أو ارفع الملفات مباشرة
3. **إعداد المتغيرات:** انسخ من `.env.example` وعدل القيم
4. **النشر:** Railway سيبني وينشر تلقائياً

### المتغيرات المطلوبة:
```env
JWT_SECRET=your_super_secure_jwt_secret_key_here
RADIUS_API_USER=your_radius_username
RADIUS_API_PASS=your_radius_password
NODE_ENV=production
```

### الأوامر:
```bash
# محلياً لاختبار البناء
npm install
npm run build
npm start

# Railway سيشغل هذا تلقائياً
```

---

## 📦 2. النشر على Vercel

### الخطوات:
1. **إنشاء حساب:** اذهب إلى [vercel.com](https://vercel.com)
2. **استيراد المشروع:** من GitHub أو رفع مباشر
3. **إعداد Build Command:** `npm run build`
4. **إعداد المتغيرات:** في إعدادات المشروع

### ملاحظة:
- Vercel مُحسن للتطبيقات الثابتة لكن يدعم Node.js
- قد تحتاج تعديل `vercel.json` حسب احتياجاتك

---

## 📦 3. النشر على DigitalOcean

### الخطوات:
1. **إنشاء Droplet:** اختر Ubuntu 22.04
2. **تثبيت Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **رفع الملفات:** استخدم SCP أو Git
4. **تثبيت وتشغيل:**
   ```bash
   npm install
   npm run build
   sudo npm install -g pm2
   pm2 start dist/index.js --name "saida-wifi-app"
   pm2 startup
   pm2 save
   ```

---

## 📦 4. استخدام Docker (لأي منصة)

### بناء الصورة:
```bash
docker build -t saida-wifi-app .
docker run -p 5000:5000 --env-file .env saida-wifi-app
```

### للنشر على أي منصة تدعم Docker:
- **Render.com**
- **fly.io**
- **Heroku** (بديل Docker)

---

## ⚙️ الإعدادات المطلوبة

### 1. متغيرات البيئة الإجبارية:
```env
JWT_SECRET=your_super_secure_jwt_secret_key_here
RADIUS_API_USER=your_radius_api_username  
RADIUS_API_PASS=your_radius_api_password
NODE_ENV=production
```

### 2. الملفات المطلوبة:
- ✅ `package.json` - موجود
- ✅ `Dockerfile` - موجود
- ✅ `railway.json` - موجود
- ✅ `vercel.json` - موجود
- ✅ `saida-wifi-logo-new.jpg` - الشعار الجديد

### 3. المنافذ:
- **التطبيق:** يعمل على المنفذ 5000
- **قواعد البيانات:** PostgreSQL (اختياري) - 5432

---

## 🔧 اختبار محلي قبل النشر

```bash
# تثبيت التبعيات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# عدل .env بالقيم الصحيحة

# بناء التطبيق
npm run build

# تشغيل الإنتاج
npm start

# اختبار التطبيق
curl http://localhost:5000
```

---

## 🌍 DNS وDomain

بعد النشر الناجح:
1. **احصل على URL:** من المنصة المختارة
2. **ربط دومين مخصص:** (اختياري) `saidawifi.com`
3. **تفعيل HTTPS:** معظم المنصات تفعله تلقائياً
4. **اختبار من سوريا:** تأكد من الوصول من MTN/Syriatel

---

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة:
1. **خطأ JWT:** تأكد من إعداد `JWT_SECRET`
2. **خطأ API:** تحقق من `RADIUS_API_USER` و `RADIUS_API_PASS`
3. **خطأ البناء:** تأكد من `npm run build` يعمل محلياً
4. **مشاكل الشعار:** تأكد من وجود `saida-wifi-logo-new.jpg`

### فحص Logs:
```bash
# Railway
railway logs

# Vercel  
vercel logs

# DigitalOcean
pm2 logs
```

---

## 📞 الدعم

**في حالة وجود مشاكل:**
1. فحص logs المنصة
2. اختبار محلي أولاً
3. التأكد من متغيرات البيئة
4. فحص اتصال DMA Radius API

---

## 🎯 التوصية

**للمبتدئين:** استخدم **Railway** - أسهل وأسرع
**للخبراء:** استخدم **DigitalOcean VPS** - مرونة أكبر
**للميزانية المحدودة:** استخدم **Vercel** - مجاني للمشاريع الصغيرة

---

*تم إعداده بواسطة Replit Agent - سبتمبر 2024*
*يعمل من جميع الشبكات في سوريا 🇸🇾*