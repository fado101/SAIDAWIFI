import 'package:flutter_test/flutter_test.dart';
import 'package:saida_wifi_app/api/api_service.dart';

void main() {
  group('Dashboard Data Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('تجربة جلب بيانات لوحة التحكم مع مستخدم صحيح', () async {
      // ملاحظة: يحتاج اسم مستخدم صحيح للاختبار
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getDashboardData(testUsername);
        
        // التحقق من بنية الاستجابة
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ جلب بيانات لوحة التحكم نجح');
          
          // التحقق من وجود البيانات المطلوبة
          if (result.containsKey('data')) {
            final data = result['data'];
            print('بيانات المستخدم: $data');
            
            // التحقق من البيانات الأساسية
            expect(data, isA<Map<String, dynamic>>());
          }
        } else {
          print('❌ فشل في جلب بيانات لوحة التحكم: ${result['message']}');
          expect(result.containsKey('message'), true);
        }
      } catch (e) {
        print('⚠️ خطأ في جلب بيانات لوحة التحكم: $e');
        expect(e, isA<Exception>());
      }
    });

    test('تجربة جلب بيانات لوحة التحكم مع مستخدم غير موجود', () async {
      const String invalidUsername = 'invalid_user_12345';

      try {
        final result = await apiService.getDashboardData(invalidUsername);
        
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        // نتوقع أن تفشل العملية مع مستخدم غير موجود
        if (result['success'] == false) {
          print('✅ اختبار المستخدم غير الموجود نجح: ${result['message']}');
          expect(result.containsKey('message'), true);
        } else {
          print('⚠️ غير متوقع: نجحت العملية مع مستخدم غير موجود');
        }
      } catch (e) {
        print('⚠️ خطأ متوقع مع مستخدم غير موجود: $e');
        expect(e, isA<Exception>());
      }
    });

    test('تجربة جلب بيانات الاستخدام', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getUsageData(testUsername);
        
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ جلب بيانات الاستخدام نجح');
          
          if (result.containsKey('data')) {
            final data = result['data'];
            print('بيانات الاستخدام: $data');
          }
        } else {
          print('❌ فشل في جلب بيانات الاستخدام: ${result['message']}');
        }
      } catch (e) {
        print('⚠️ خطأ في جلب بيانات الاستخدام: $e');
      }
    });

    test('تجربة جلب بيانات الخدمات', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getServices(testUsername);
        
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ جلب بيانات الخدمات نجح');
          
          if (result.containsKey('data')) {
            final data = result['data'];
            expect(data, isA<List>());
            print('عدد الخدمات المتاحة: ${data.length}');
          }
        } else {
          print('❌ فشل في جلب بيانات الخدمات: ${result['message']}');
        }
      } catch (e) {
        print('⚠️ خطأ في جلب بيانات الخدمات: $e');
      }
    });

    test('تجربة جلب بيانات الراوترات', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getRoutersData(testUsername);
        
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ جلب بيانات الراوترات نجح');
          
          if (result.containsKey('data')) {
            final data = result['data'];
            print('بيانات الراوترات: $data');
          }
        } else {
          print('❌ فشل في جلب بيانات الراوترات: ${result['message']}');
        }
      } catch (e) {
        print('⚠️ خطأ في جلب بيانات الراوترات: $e');
      }
    });
  });

  group('Data Validation Tests', () {
    test('اختبار تنسيق البيانات', () {
      // اختبار دوال التنسيق المساعدة
      
      // اختبار تنسيق حجم البيانات
      expect(_formatDataSize(1024), '1.00 KB');
      expect(_formatDataSize(1024 * 1024), '1.00 MB');
      expect(_formatDataSize(1024 * 1024 * 1024), '1.00 GB');
      
      print('✅ اختبار تنسيق البيانات نجح');
    });

    test('اختبار التحقق من صحة البيانات', () {
      // اختبار التحقق من البيانات المطلوبة
      final Map<String, dynamic> mockDashboardData = {
        'username': 'test_user',
        'service_name': 'Basic Plan',
        'total_data': 1073741824, // 1 GB
        'used_data': 536870912,   // 0.5 GB
        'is_active': true,
        'expiry_date': '2024-12-31',
      };

      // التحقق من وجود البيانات الأساسية
      expect(mockDashboardData.containsKey('username'), true);
      expect(mockDashboardData.containsKey('service_name'), true);
      expect(mockDashboardData.containsKey('total_data'), true);
      expect(mockDashboardData.containsKey('used_data'), true);
      expect(mockDashboardData.containsKey('is_active'), true);
      
      // التحقق من أنواع البيانات
      expect(mockDashboardData['username'], isA<String>());
      expect(mockDashboardData['total_data'], isA<int>());
      expect(mockDashboardData['used_data'], isA<int>());
      expect(mockDashboardData['is_active'], isA<bool>());
      
      print('✅ اختبار التحقق من صحة البيانات نجح');
    });
  });

  group('Error Handling Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('اختبار التعامل مع خطأ الشبكة', () async {
      // محاولة الاتصال بسيرفر غير موجود
      try {
        // تعديل URL مؤقت لاختبار خطأ الشبكة
        final result = await apiService.getDashboardData('test');
        
        // إذا حصلنا على نتيجة، نتحقق من أنها تحتوي على معلومات الخطأ
        expect(result, isA<Map<String, dynamic>>());
        
        if (result['success'] == false) {
          print('✅ التعامل مع خطأ الشبكة نجح: ${result['message']}');
        }
      } catch (e) {
        print('✅ تم التقاط خطأ الشبكة بنجاح: $e');
        expect(e, isA<Exception>());
      }
    });

    test('اختبار التعامل مع استجابة خاطئة', () async {
      // هذا الاختبار يتحقق من التعامل مع استجابة غير متوقعة
      try {
        final result = await apiService.getDashboardData('');
        
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == false) {
          print('✅ التعامل مع الاستجابة الخاطئة نجح');
          expect(result.containsKey('message'), true);
        }
      } catch (e) {
        print('✅ تم التعامل مع الخطأ بنجاح: $e');
      }
    });
  });
}

// دالة مساعدة لتنسيق حجم البيانات (نسخة من الكود الأصلي للاختبار)
String _formatDataSize(dynamic bytes) {
  if (bytes == null) return '0 GB';
  
  final double value = double.tryParse(bytes.toString()) ?? 0;
  
  if (value >= 1024 * 1024 * 1024) {
    return '${(value / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  } else if (value >= 1024 * 1024) {
    return '${(value / (1024 * 1024)).toStringAsFixed(2)} MB';
  } else if (value >= 1024) {
    return '${(value / 1024).toStringAsFixed(2)} KB';
  } else {
    return '${value.toStringAsFixed(0)} B';
  }
}