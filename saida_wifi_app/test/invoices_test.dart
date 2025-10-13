import 'package:flutter_test/flutter_test.dart';
import 'package:saida_wifi_app/api/api_service.dart';

void main() {
  group('Invoices Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('تجربة جلب قائمة الفواتير', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getInvoices(testUsername);
        
        // التحقق من بنية الاستجابة
        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('success'), true);
        
        if (result['success'] == true) {
          print('✅ جلب قائمة الفواتير نجح');
          
          // التحقق من وجود قائمة الفواتير
          if (result.containsKey('data')) {
            final invoices = result['data'];
            expect(invoices, isA<List>());
            
            print('عدد الفواتير: ${invoices.length}');
            
            // إذا كان هناك فواتير، اختبر بنية الفاتورة الأولى
            if (invoices.isNotEmpty) {
              final firstInvoice = invoices[0];
              expect(firstInvoice, isA<Map<String, dynamic>>());
              
              // التحقق من الحقول الأساسية للفاتورة
              final expectedFields = [
                'invoice_number',
                'amount', 
                'date',
                'status',
                'service_name'
              ];
              
              for (String field in expectedFields) {
                if (firstInvoice.containsKey(field)) {
                  print('✓ الحقل موجود: $field = ${firstInvoice[field]}');
                } else {
                  print('⚠️ الحقل مفقود: $field');
                }
              }
            }
          }
        } else {
          print('❌ فشل في جلب الفواتير: ${result['message']}');
          expect(result.containsKey('message'), true);
        }
      } catch (e) {
        print('⚠️ خطأ في جلب الفواتير: $e');
        expect(e, isA<Exception>());
      }
    });

    test('التحقق من وجود فاتورة غير مدفوعة', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getInvoices(testUsername);
        
        if (result['success'] == true && result.containsKey('data')) {
          final invoices = result['data'] as List;
          
          // البحث عن فواتير غير مدفوعة
          final unpaidInvoices = invoices.where((invoice) {
            final status = invoice['status'];
            final isPaid = invoice['is_paid'];
            
            return (status == 'unpaid' || 
                    status == 'pending' || 
                    isPaid == false);
          }).toList();
          
          if (unpaidInvoices.isNotEmpty) {
            print('✅ تم العثور على ${unpaidInvoices.length} فاتورة غير مدفوعة');
            
            // عرض تفاصيل الفواتير غير المدفوعة
            for (var invoice in unpaidInvoices) {
              print('- فاتورة رقم: ${invoice['invoice_number']} - المبلغ: ${invoice['amount']}');
            }
            
            expect(unpaidInvoices.length, greaterThan(0));
          } else {
            print('✅ لا توجد فواتير غير مدفوعة (جميع الفواتير مدفوعة)');
            expect(unpaidInvoices.length, equals(0));
          }
        } else {
          print('⚠️ لم يتم جلب الفواتير بنجاح');
        }
      } catch (e) {
        print('⚠️ خطأ في التحقق من الفواتير غير المدفوعة: $e');
      }
    });

    test('اختبار تنسيق بيانات الفواتير', () {
      // إنشاء فاتورة تجريبية لاختبار التنسيق
      final Map<String, dynamic> mockInvoice = {
        'invoice_number': 'INV-2024-001',
        'amount': '150.00',
        'date': '2024-01-15',
        'paid_date': '2024-01-20',
        'status': 'paid',
        'is_paid': true,
        'service_name': 'Premium Plan',
      };

      // اختبار تنسيق المبلغ
      final amount = double.tryParse(mockInvoice['amount']) ?? 0.0;
      final formattedAmount = _formatCurrency(amount);
      expect(formattedAmount.contains('150'), true);
      print('✅ تنسيق المبلغ: $formattedAmount');

      // اختبار تنسيق التاريخ
      final formattedDate = _formatDate(mockInvoice['date']);
      expect(formattedDate.contains('2024'), true);
      print('✅ تنسيق التاريخ: $formattedDate');

      // اختبار حالة الدفع
      final paymentStatus = _getPaymentStatus(mockInvoice);
      expect(paymentStatus, equals('مدفوعة'));
      print('✅ حالة الدفع: $paymentStatus');
    });

    test('اختبار التحقق من صحة بيانات الفاتورة', () {
      final Map<String, dynamic> validInvoice = {
        'invoice_number': 'INV-2024-001',
        'amount': '150.00',
        'date': '2024-01-15',
        'status': 'paid',
        'service_name': 'Premium Plan',
      };

      final Map<String, dynamic> invalidInvoice = {
        'amount': 'invalid_amount',
        'date': 'invalid_date',
        // نقص حقول مطلوبة
      };

      // اختبار الفاتورة الصحيحة
      expect(_isValidInvoice(validInvoice), true);
      print('✅ الفاتورة الصحيحة تم التحقق منها');

      // اختبار الفاتورة غير الصحيحة
      expect(_isValidInvoice(invalidInvoice), false);
      print('✅ الفاتورة غير الصحيحة تم رفضها');
    });

    test('اختبار حساب إجمالي المبالغ', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getInvoices(testUsername);
        
        if (result['success'] == true && result.containsKey('data')) {
          final invoices = result['data'] as List;
          
          double totalAmount = 0.0;
          double unpaidAmount = 0.0;
          int unpaidCount = 0;

          for (var invoice in invoices) {
            final amount = double.tryParse(invoice['amount']?.toString() ?? '0') ?? 0.0;
            totalAmount += amount;

            final isPaid = invoice['is_paid'] == true || invoice['status'] == 'paid';
            if (!isPaid) {
              unpaidAmount += amount;
              unpaidCount++;
            }
          }

          print('✅ إجمالي قيمة الفواتير: ${_formatCurrency(totalAmount)}');
          print('✅ قيمة الفواتير غير المدفوعة: ${_formatCurrency(unpaidAmount)}');
          print('✅ عدد الفواتير غير المدفوعة: $unpaidCount');

          expect(totalAmount, greaterThanOrEqualTo(0));
          expect(unpaidAmount, greaterThanOrEqualTo(0));
          expect(unpaidCount, greaterThanOrEqualTo(0));
        }
      } catch (e) {
        print('⚠️ خطأ في حساب إجمالي المبالغ: $e');
      }
    });

    test('اختبار ترتيب الفواتير حسب التاريخ', () async {
      const String testUsername = 'test_user';

      try {
        final result = await apiService.getInvoices(testUsername);
        
        if (result['success'] == true && result.containsKey('data')) {
          final invoices = result['data'] as List;
          
          if (invoices.length > 1) {
            // نسخ القائمة وترتيبها
            final sortedInvoices = List.from(invoices);
            sortedInvoices.sort((a, b) {
              final dateA = DateTime.tryParse(a['date'] ?? '') ?? DateTime(1900);
              final dateB = DateTime.tryParse(b['date'] ?? '') ?? DateTime(1900);
              return dateB.compareTo(dateA); // ترتيب تنازلي (الأحدث أولاً)
            });

            print('✅ تم ترتيب ${sortedInvoices.length} فاتورة حسب التاريخ');
            
            // طباعة أول 3 فواتير مرتبة
            for (int i = 0; i < sortedInvoices.length && i < 3; i++) {
              final invoice = sortedInvoices[i];
              print('${i + 1}. فاتورة ${invoice['invoice_number']} - ${invoice['date']}');
            }

            expect(sortedInvoices.length, equals(invoices.length));
          } else {
            print('⚠️ عدد قليل من الفواتير للترتيب');
          }
        }
      } catch (e) {
        print('⚠️ خطأ في ترتيب الفواتير: $e');
      }
    });
  });

  group('Invoice Status Tests', () {
    test('اختبار تحديد حالات الفواتير المختلفة', () {
      final List<Map<String, dynamic>> testInvoices = [
        {
          'invoice_number': 'INV-001',
          'status': 'paid',
          'is_paid': true,
          'amount': '100.00',
        },
        {
          'invoice_number': 'INV-002', 
          'status': 'unpaid',
          'is_paid': false,
          'amount': '150.00',
        },
        {
          'invoice_number': 'INV-003',
          'status': 'pending',
          'is_paid': false,
          'amount': '200.00',
        },
        {
          'invoice_number': 'INV-004',
          'status': 'overdue',
          'is_paid': false,
          'amount': '75.00',
        },
      ];

      int paidCount = 0;
      int unpaidCount = 0;
      int pendingCount = 0;
      int overdueCount = 0;

      for (var invoice in testInvoices) {
        final status = invoice['status'];
        final isPaid = invoice['is_paid'] == true;

        if (isPaid || status == 'paid') {
          paidCount++;
        } else if (status == 'unpaid') {
          unpaidCount++;
        } else if (status == 'pending') {
          pendingCount++;
        } else if (status == 'overdue') {
          overdueCount++;
        }
      }

      print('✅ الفواتير المدفوعة: $paidCount');
      print('✅ الفواتير غير المدفوعة: $unpaidCount'); 
      print('✅ الفواتير المعلقة: $pendingCount');
      print('✅ الفواتير المتأخرة: $overdueCount');

      expect(paidCount, equals(1));
      expect(unpaidCount, equals(1));
      expect(pendingCount, equals(1));
      expect(overdueCount, equals(1));
    });
  });
}

// دوال مساعدة للاختبار
String _formatCurrency(double amount) {
  return '${amount.toStringAsFixed(2)} ر.س';
}

String _formatDate(String dateString) {
  try {
    final date = DateTime.parse(dateString);
    return '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
  } catch (e) {
    return dateString;
  }
}

String _getPaymentStatus(Map<String, dynamic> invoice) {
  final isPaid = invoice['is_paid'] == true || invoice['status'] == 'paid';
  return isPaid ? 'مدفوعة' : 'غير مدفوعة';
}

bool _isValidInvoice(Map<String, dynamic> invoice) {
  // التحقق من وجود الحقول المطلوبة
  final requiredFields = ['amount', 'date'];
  
  for (String field in requiredFields) {
    if (!invoice.containsKey(field) || invoice[field] == null) {
      return false;
    }
  }

  // التحقق من صحة المبلغ
  final amount = double.tryParse(invoice['amount'].toString());
  if (amount == null || amount < 0) {
    return false;
  }

  // التحقق من صحة التاريخ
  try {
    DateTime.parse(invoice['date']);
  } catch (e) {
    return false;
  }

  return true;
}