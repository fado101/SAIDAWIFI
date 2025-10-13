# دليل نشر التطبيق - تطبيق إدارة العملاء

## ⚠️ تحذيرات الأمان المهمة

### 🔒 إصلاحات أمنية مطلوبة على السيرفر الجديد:

#### 1. متغيرات البيئة المطلوبة:
```env
# متغيرات أمنية إجبارية
JWT_SECRET=your_super_secure_jwt_secret_key_here
RADIUS_API_USER=your_radius_api_username
RADIUS_API_PASS=your_radius_api_password

# إعدادات قاعدة البيانات
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### 2. إصلاحات TLS مطلوبة في server/routes.ts:
```javascript
// ❌ خطير - موجود حالياً
const insecureHttpsAgent = new https.Agent({ 
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined 
});

// ✅ آمن - يجب التطبيق
const secureHttpsAgent = new https.Agent({ 
  rejectUnauthorized: true 
});
```

#### 3. شهادة SSL مطلوبة:
- يجب أن يكون لدى `saidawifi.com` شهادة SSL صحيحة من جهة موثوقة (CA)
- أو تكوين certificate pinning إذا كانت الشهادة self-signed

#### 4. إزالة/تقييد صفحات التصحيح:
- حذف أو تأمين `/debug` و `/api-test` في الإنتاج
- تقييد الوصول بـ IP whitelist أو authentication

## 📦 محتويات حزمة النشر

### Frontend (client/):
- **src/**: مصدر التطبيق React مع TypeScript
- **public/**: ملفات الأصول العامة
- **package.json**: التبعيات والـ scripts

### Backend (server/):
- **index.ts**: خادم Express الرئيسي
- **routes.ts**: مسارات API (يحتاج إصلاحات TLS)
- **db.ts**: اتصال قاعدة البيانات
- **radiusApi.ts**: واجهة Radius Manager API (تم تأمينها ✅)
- **renewalService.ts**: خدمة التجديد (تم إصلاحها ✅)

### Shared (shared/):
- **schema.ts**: نماذج البيانات المشتركة

## 🚀 خطوات النشر

### 1. تحضير البيئة:
```bash
# تثبيت Node.js 18+
# تثبيت PostgreSQL
# إعداد Nginx كـ reverse proxy
```

### 2. تثبيت التطبيق:
```bash
# نسخ الملفات
npm install

# إعداد قاعدة البيانات
npm run db:push

# بناء الإنتاج
npm run build
```

### 3. تطبيق الإصلاحات الأمنية:
```bash
# تحديث متغيرات البيئة
# إصلاح server/routes.ts (استبدال insecure agents)
# تفعيل HTTPS مع شهادة صحيحة
# إزالة debug endpoints من الإنتاج
```

### 4. تشغيل الإنتاج:
```bash
npm start
```

## 🔧 الميزات المضمنة

- **المصادقة الآمنة** مع JWT tokens
- **إدارة العملاء** مع بيانات الاستخدام
- **الفواتير والتجديد** التلقائي
- **تقارير الاستخدام** التفصيلية
- **واجهة إدارية** لخدمات الشبكة
- **دعم Mobile APK** عبر Capacitor

## 📊 متطلبات النظام

- **Node.js**: 18+ 
- **PostgreSQL**: 12+
- **RAM**: 2GB دنيا
- **Storage**: 10GB للبيانات والlogفات
- **SSL Certificate**: شهادة صحيحة لـ saidawifi.com

## 🛡️ ملاحظات الأمان

⚠️ **هذه الحزمة تحتوي على مشاكل أمنية معروفة في server/routes.ts**
✅ **تم إصلاح radiusApi.ts و renewalService.ts و API config**
📋 **اتبع خطوات الإصلاح في deployment-security-fixes.md**

## 📞 الدعم التقني

في حالة وجود مشاكل، تحقق من:
- log ملفات الخادم
- إعدادات قاعدة البيانات
- شهادة SSL وDNS
- متغيرات البيئة

---
*تم إنشاؤه بواسطة Replit Agent - سبتمبر 2024*