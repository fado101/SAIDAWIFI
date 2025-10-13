import 'package:flutter/material.dart';
import '../api/api_service.dart';

class ConnectionTestPage extends StatefulWidget {
  const ConnectionTestPage({super.key});

  @override
  State<ConnectionTestPage> createState() => _ConnectionTestPageState();
}

class _ConnectionTestPageState extends State<ConnectionTestPage> {
  final ApiService _apiService = ApiService();
  String _testResult = 'لم يتم الاختبار بعد';
  bool _isLoading = false;
  bool _testPassed = false;

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _testResult = 'جاري اختبار الاتصال بالسيرفر السوري...';
      _testPassed = false;
    });

    try {
      final result = await _apiService.testConnection();
      setState(() {
        _testResult = result['message'];
        _testPassed = result['success'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _testResult = 'خطأ غير متوقع: ${e.toString()}';
        _testPassed = false;
        _isLoading = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    // اختبار تلقائي عند فتح الصفحة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _testConnection();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('اختبار الاتصال بالسيرفر السوري'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // معلومات السيرفر
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.dns, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        const Text(
                          'معلومات السيرفر:',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow('العنوان:', 'http://108.181.215.206:3000'),
                    _buildInfoRow('النوع:', 'Node.js API Server'),
                    _buildInfoRow('المنطقة:', 'سوريا 🇸🇾'),
                    _buildInfoRow('البروتوكول:', 'HTTP (مناسب للشبكات السورية)'),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // زر الاختبار
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _testConnection,
              icon: _isLoading 
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.network_check),
              label: Text(_isLoading ? 'جاري الاختبار...' : 'إعادة اختبار الاتصال'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // نتيجة الاختبار
            Card(
              elevation: 4,
              color: _testPassed 
                  ? Colors.green.shade50
                  : _testResult.contains('خطأ') || _testResult.contains('فشل')
                      ? Colors.red.shade50
                      : Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _testPassed 
                              ? Icons.check_circle 
                              : _testResult.contains('خطأ')
                                  ? Icons.error
                                  : Icons.info,
                          color: _testPassed 
                              ? Colors.green 
                              : _testResult.contains('خطأ')
                                  ? Colors.red
                                  : Colors.orange,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'نتيجة الاختبار:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _testResult,
                      style: TextStyle(
                        color: _testPassed 
                            ? Colors.green.shade700
                            : _testResult.contains('خطأ')
                                ? Colors.red.shade700
                                : Colors.orange.shade700,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (_testPassed) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.green.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade300),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.thumb_up, color: Colors.green, size: 20),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'ممتاز! يمكنك الآن استخدام التطبيق بشكل طبيعي',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // معلومات إضافية
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade600),
                        const SizedBox(width: 8),
                        const Text(
                          'ملاحظات هامة:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '• هذا السيرفر مُحسن للعمل مع الشبكات السورية (MTN, Syriatel)\n'
                      '• يستخدم بروتوكول HTTP لتجنب مشاكل SSL\n'
                      '• مهلة الاتصال مُعدلة لتناسب سرعة الشبكات المحلية\n'
                      '• في حالة فشل الاختبار، تحقق من اتصالك بالإنترنت',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}