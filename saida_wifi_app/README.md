# SAIDA WiFi Manager - Flutter App

تطبيق Flutter لإدارة خدمات شبكة صيدا WiFi.

## الميزات

- 🔐 تسجيل دخول آمن
- 📊 لوحة تحكم شاملة
- 📋 إدارة الفواتير
- 📈 تقارير الاستخدام  
- ⚙️ إعدادات الخدمات
- 🌐 إدارة الراوترات
- 🌍 دعم اللغة العربية (RTL)

## المتطلبات

- Flutter SDK (>= 3.2.0)
- Dart SDK
- Android Studio / VS Code
- Android SDK (للبناء على Android)

## التثبيت

```bash
# نسخ المشروع
git clone <repository-url>
cd saida_wifi_app

# تثبيت التبعيات
flutter pub get

# تشغيل التطبيق
flutter run
```

## البناء للإنتاج

```bash
# بناء APK للأندرويد
flutter build apk --release

# بناء App Bundle للأندرويد
flutter build appbundle --release
```

## اختبار التطبيق

```bash
# تشغيل جميع الاختبارات
flutter test

# تشغيل اختبار محدد
flutter test test/login_test.dart
```

## هيكل المشروع

```
lib/
├── main.dart              # نقطة البداية
├── api/
│   └── api_service.dart   # خدمة الاتصال بـ API
└── pages/
    ├── login_page.dart    # صفحة تسجيل الدخول
    ├── dashboard_page.dart # لوحة التحكم
    ├── invoices_page.dart # صفحة الفواتير  
    ├── usage_page.dart    # تقارير الاستخدام
    ├── services_page.dart # الخدمات
    └── routers_page.dart  # إدارة الراوترات

test/
├── login_test.dart        # اختبارات تسجيل الدخول
├── dashboard_test.dart    # اختبارات لوحة التحكم
└── invoices_test.dart     # اختبارات الفواتير
```

## API Configuration

التطبيق يتصل مع DMA Radius Manager API على:
```
http://108.181.215.206/radiusmanager/api/
```

## المكتبات المستخدمة

- `dio`: للاتصال بـ API
- `flutter_riverpod`: لإدارة الحالة
- `intl`: لتنسيق التاريخ والأرقام
- `shared_preferences`: لتخزين البيانات محلياً

## الدعم

للحصول على المساعدة، يرجى التواصل مع فريق الدعم الفني.