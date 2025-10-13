import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';
import 'login_page.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _apiService.getDashboardData();
      
      setState(() {
        if (result['success'] == true) {
          _dashboardData = result;
        } else {
          _error = result['message'] ?? 'خطأ في جلب البيانات';
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل البيانات: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    try {
      await _apiService.logout();
      if (mounted) {
        // العودة لصفحة تسجيل الدخول
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginPage()),
          (route) => false,
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('خطأ في تسجيل الخروج: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة التحكم'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDashboardData,
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDashboardData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // بطاقة معلومات المستخدم
                        _buildUserInfoCard(),
                        
                        const SizedBox(height: 16),
                        
                        // بطاقة استخدام البيانات
                        _buildDataUsageCard(),
                        
                        const SizedBox(height: 16),
                        
                        // بطاقة حالة الخدمة
                        _buildServiceStatusCard(),
                        
                        const SizedBox(height: 16),
                        
                        // بطاقة الفواتير السريعة
                        _buildQuickInvoicesCard(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildUserInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.person, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  'معلومات المستخدم',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow('اسم المستخدم', _dashboardData?['user']?['firstName'] ?? 'غير متوفر'),
            _buildInfoRow('الخدمة', _dashboardData?['service']?['name'] ?? 'غير متوفر'),
            _buildInfoRow('حالة الاتصال', _dashboardData?['stats']?['connectionStatus'] ?? 'متصل'),
          ],
        ),
      ),
    );
  }

  Widget _buildDataUsageCard() {
    final totalData = _dashboardData?['service']?['totalData'] ?? 0;
    final usedData = _dashboardData?['service']?['usedData'] ?? 0;
    final remainingData = _dashboardData?['service']?['remainingData'] ?? 0;
    final usagePercentage = totalData > 0 ? (usedData / totalData) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.data_usage, color: Colors.green),
                const SizedBox(width: 8),
                Text(
                  'استخدام البيانات',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            
            // شريط التقدم
            LinearProgressIndicator(
              value: usagePercentage,
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(
                usagePercentage > 0.8 ? Colors.red : Colors.green,
              ),
            ),
            
            const SizedBox(height: 12),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('المستخدم: ${_formatDataSize(usedData)}'),
                Text('المتبقي: ${_formatDataSize(remainingData)}'),
              ],
            ),
            
            Text(
              'الإجمالي: ${_formatDataSize(totalData)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceStatusCard() {
    final expiryDate = _dashboardData?['service']?['expiryDate'];
    final isActive = !(_dashboardData?['service']?['isExpired'] ?? false);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.wifi,
                  color: isActive ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 8),
                Text(
                  'حالة الخدمة',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow(
              'الحالة', 
              isActive ? 'نشط' : 'غير نشط',
              valueColor: isActive ? Colors.green : Colors.red,
            ),
            if (expiryDate != null)
              _buildInfoRow('تاريخ الانتهاء', _formatDate(expiryDate)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickInvoicesCard() {
    final unpaidInvoices = _dashboardData?['unpaidInvoices']?.length ?? 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.receipt, color: Colors.orange),
                const SizedBox(width: 8),
                Text(
                  'الفواتير',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow(
              'الفواتير غير المدفوعة', 
              unpaidInvoices.toString(),
              valueColor: unpaidInvoices > 0 ? Colors.red : Colors.green,
            ),
            if (unpaidInvoices > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: ElevatedButton.icon(
                  onPressed: () {
                    // الانتقال إلى صفحة الفواتير
                  },
                  icon: const Icon(Icons.payment),
                  label: const Text('عرض الفواتير'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? Colors.grey.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

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

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('yyyy/MM/dd').format(date);
    } catch (e) {
      return dateString;
    }
  }
}