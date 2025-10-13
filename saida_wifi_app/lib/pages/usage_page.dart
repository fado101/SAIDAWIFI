import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';
import 'hierarchical_usage_page.dart';

class UsagePage extends ConsumerStatefulWidget {
  const UsagePage({super.key});

  @override
  ConsumerState<UsagePage> createState() => _UsagePageState();
}

class _UsagePageState extends ConsumerState<UsagePage> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _usageData;
  bool _isLoading = true;
  String? _error;
  String _selectedPeriod = 'weekly'; // weekly, monthly, yearly

  @override
  void initState() {
    super.initState();
    _loadUsageData();
  }

  Future<void> _loadUsageData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getUsageData(username);
        
        setState(() {
          if (result['success'] == true) {
            _usageData = result['data'];
          } else {
            _error = result['message']?.toString() ?? 'خطأ غير معروف';
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'لم يتم العثور على بيانات المستخدم';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل بيانات الاستخدام: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تقارير الاستخدام'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.timeline),
            tooltip: 'التقارير المفصلة',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const HierarchicalUsagePage(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUsageData,
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
                        onPressed: _loadUsageData,
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadUsageData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // فلتر الفترة الزمنية
                        _buildPeriodSelector(),
                        
                        const SizedBox(height: 16),
                        
                        // ملخص الاستخدام
                        _buildUsageSummary(),
                        
                        const SizedBox(height: 16),
                        
                        // الرسم البياني (محاكاة)
                        _buildUsageChart(),
                        
                        const SizedBox(height: 16),
                        
                        // تفاصيل الاستخدام اليومي
                        _buildDailyUsageDetails(),
                        
                        const SizedBox(height: 16),
                        
                        // إحصائيات إضافية
                        _buildAdditionalStats(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildPeriodSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'الفترة الزمنية',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildPeriodButton('أسبوعي', 'weekly'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildPeriodButton('شهري', 'monthly'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildPeriodButton('سنوي', 'yearly'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodButton(String label, String value) {
    final isSelected = _selectedPeriod == value;
    return ElevatedButton(
      onPressed: () {
        setState(() {
          _selectedPeriod = value;
        });
        _loadUsageData();
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? Theme.of(context).primaryColor : Colors.grey.shade200,
        foregroundColor: isSelected ? Colors.white : Colors.black,
      ),
      child: Text(label),
    );
  }

  Widget _buildUsageSummary() {
    final totalUsage = _usageData?['total_usage'] ?? 0;
    final averageDaily = _usageData?['average_daily'] ?? 0;
    final peakUsage = _usageData?['peak_usage'] ?? 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ملخص الاستخدام',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem(
                  'الإجمالي',
                  _formatDataSize(totalUsage),
                  Icons.data_usage,
                  Colors.blue,
                ),
                _buildSummaryItem(
                  'المتوسط اليومي',
                  _formatDataSize(averageDaily),
                  Icons.timeline,
                  Colors.green,
                ),
                _buildSummaryItem(
                  'الذروة',
                  _formatDataSize(peakUsage),
                  Icons.trending_up,
                  Colors.orange,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildUsageChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'الرسم البياني للاستخدام',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            // محاكاة رسم بياني بسيط
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bar_chart,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'الرسم البياني للاستخدام',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'سيتم إضافة مكتبة charts لاحقاً',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyUsageDetails() {
    final dailyUsage = _usageData?['daily_usage'] ?? [];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'الاستخدام اليومي',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            
            if (dailyUsage.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text(
                    'لا توجد بيانات استخدام يومية',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: dailyUsage.length > 7 ? 7 : dailyUsage.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final day = dailyUsage[index];
                  return _buildDailyUsageItem(day);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyUsageItem(Map<String, dynamic> day) {
    final date = day['date'] ?? '';
    final usage = day['usage'] ?? 0;
    final sessions = day['sessions'] ?? 0;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: Colors.blue.shade100,
        child: Text(
          _formatDayOfWeek(date),
          style: TextStyle(
            color: Colors.blue.shade700,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      title: Text(_formatDate(date)),
      subtitle: Text('$sessions جلسة'),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            _formatDataSize(usage),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          Text(
            'الاستخدام',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdditionalStats() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'إحصائيات إضافية',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            _buildStatRow('زمن الاتصال الإجمالي', '${_usageData?['total_time'] ?? 0} ساعة'),
            _buildStatRow('عدد الجلسات', '${_usageData?['total_sessions'] ?? 0}'),
            _buildStatRow('متوسط زمن الجلسة', '${_usageData?['average_session'] ?? 0} دقيقة'),
            _buildStatRow('أعلى استخدام في يوم', _formatDataSize(_usageData?['peak_day_usage'] ?? 0)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
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
      return DateFormat('MMM dd, yyyy', 'ar').format(date);
    } catch (e) {
      return dateString;
    }
  }

  String _formatDayOfWeek(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('EEE', 'ar').format(date);
    } catch (e) {
      return '';
    }
  }
}