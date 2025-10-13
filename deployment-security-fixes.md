# إصلاحات الأمان المطلوبة للتصدير

## المشاكل الأمنية الحرجة المتبقية:

### 1. TLS Verification في server/routes.ts
- **المشكلة:** عدة instances من `rejectUnauthorized: false`
- **الحل:** تفعيل TLS verification واستخدام hostname صحيح بدلاً من IP

### 2. Hardcoded Credentials في renewalService.ts  
- **المشكلة:** `apiuser=api&apipass=api123` لا تزال موجودة في URLs
- **الحل:** استخدام متغيرات البيئة بشكل صحيح

### 3. استخدام IP بدلاً من Hostname
- **المشكلة:** `108.181.215.206` يسبب مشاكل certificate validation
- **الحل:** استخدام `saidawifi.com` مع شهادة SSL صحيحة

### 4. صفحات التصحيح في الإنتاج
- **المشكلة:** debug pages قد تكون مكشوفة
- **الحل:** تقييد الوصول أو إزالتها في الإنتاج

## الإصلاحات المطبقة:
✅ إصلاح API config لإزالة Replit URLs  
✅ تحديث radiusApi.ts لتفعيل TLS verification  
✅ بداية إصلاح renewalService.ts  

## الإصلاحات المتبقية:
❌ إصلاح جميع instances في server/routes.ts (1707 سطر)
❌ استكمال إصلاح renewalService.ts 
❌ استبدال IP بـ hostname في جميع الطلبات
❌ تقييد صفحات التصحيح

## التوصية:
نظراً لحجم ملف routes.ts (1707 سطر) وكثرة المشاكل الأمنية، أنصح بـ:
1. إنشاء ملف إصلاحات منفصل للتطبيق على السيرفر الجديد
2. تصدير التطبيق الحالي مع تحذيرات أمنية واضحة
3. تطبيق الإصلاحات على السيرفر الجديد قبل الإنتاج