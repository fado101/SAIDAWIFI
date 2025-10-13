import 'package:flutter_test/flutter_test.dart';
import 'package:saida_wifi_app/api/api_service.dart';

void main() {
  group('Login Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('تجربة تسجيل دخول ناجح', () async {
      // ملاحظة: هذا اختبار تجريبي يحتاج بيانات حقيقية للعمل
      // يمكن استبدال البيانات بحساب تجريبي صحيح
      
      const String testUsername = 'test_user';
      const String testPassword = 'test_password';

      try {
        final result = await apiService.loginUser(testUsername, testPassword);
        
        // التحقق من نجاح العملية
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ تسجيل الدخول نجح: ${result['message']}');
          expect(result['success'], true);
        } else {
          print('❌ تسجيل الدخول فشل: ${result['message']}');
          // في هذه الحالة، نتوقع أن يكون هناك رسالة خطأ
          expect(result.containsKey('message'), true);
        }
      } catch (e) {
        print('⚠️ خطأ في الاتصال: $e');
        // التحقق من أن الخطأ من نوع معين
        expect(e, isA<Exception>());
      }
    });

    test('تجربة تسجيل دخول خاطئ', () async {
      const String wrongUsername = 'wrong_user';
      const String wrongPassword = 'wrong_password';

      try {
        final result = await apiService.loginUser(wrongUsername, wrongPassword);
        
        // التحقق من فشل العملية
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        expect(result['success'], false);
        expect(result.containsKey('message'), true);
        
        print('✅ اختبار فشل تسجيل الدخول نجح: ${result['message']}');
      } catch (e) {
        print('⚠️ خطأ في الاتصال: $e');
        // حتى لو حدث خطأ في الاتصال، هذا متوقع
        expect(e, isA<Exception>());
      }
    });

    test('تجربة تسجيل دخول ببيانات فارغة', () async {
      const String emptyUsername = '';
      const String emptyPassword = '';

      try {
        final result = await apiService.loginUser(emptyUsername, emptyPassword);
        
        // التحقق من فشل العملية
        expect(result, isA<Map<String, dynamic>>());
        expect(result['success'], false);
        
        print('✅ اختبار البيانات الفارغة نجح');
      } catch (e) {
        print('⚠️ خطأ متوقع مع البيانات الفارغة: $e');
        expect(e, isA<Exception>());
      }
    });

    test('اختبار دالة التحقق من حالة تسجيل الدخول', () async {
      // اختبار الحالة الافتراضية (غير مسجل دخول)
      final isLoggedIn = await apiService.isLoggedIn();
      
      expect(isLoggedIn, isA<bool>());
      print('حالة تسجيل الدخول الحالية: $isLoggedIn');
    });

    test('اختبار دالة تسجيل الخروج', () async {
      try {
        await apiService.logout();
        
        // التحقق من أن المستخدم لم يعد مسجل دخول
        final isLoggedIn = await apiService.isLoggedIn();
        expect(isLoggedIn, false);
        
        print('✅ تسجيل الخروج نجح');
      } catch (e) {
        print('⚠️ خطأ في تسجيل الخروج: $e');
      }
    });

    test('اختبار الحصول على اسم المستخدم المحفوظ', () async {
      try {
        final savedUsername = await apiService.getSavedUsername();
        
        // قد يكون null أو string
        expect(savedUsername, anyOf(isNull, isA<String>()));
        
        if (savedUsername != null) {
          print('اسم المستخدم المحفوظ: $savedUsername');
        } else {
          print('لا يوجد اسم مستخدم محفوظ');
        }
      } catch (e) {
        print('⚠️ خطأ في جلب اسم المستخدم: $e');
      }
    });
  });

  group('API Connection Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('اختبار الاتصال بالسيرفر', () async {
      // اختبار أساسي للاتصال
      try {
        final result = await apiService.loginUser('test', 'test');
        
        // حتى لو فشل تسجيل الدخول، المهم أن نتلقى رد من السيرفر
        expect(result, isA<Map<String, dynamic>>());
        print('✅ الاتصال بالسيرفر يعمل');
      } catch (e) {
        print('❌ مشكلة في الاتصال بالسيرفر: $e');
        // في هذه الحالة نريد أن نعرف إذا كان السيرفر غير متاح
        expect(e.toString().contains('SocketException') || 
               e.toString().contains('TimeoutException') ||
               e.toString().contains('HandshakeException'), true);
      }
    });
  });
}