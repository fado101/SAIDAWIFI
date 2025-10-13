import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';

class ServicesPage extends ConsumerStatefulWidget {
  const ServicesPage({super.key});

  @override
  ConsumerState<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends ConsumerState<ServicesPage> {
  final ApiService _apiService = ApiService();
  List<dynamic> _services = [];
  Map<String, dynamic>? _currentService;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getServices(username);
        
        setState(() {
          if (result['success'] == true) {
            _services = result['data'] ?? [];
            _currentService = result['current_service'];
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
        _error = 'خطأ في تحميل الخدمات: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الخدمات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadServices,
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
                        onPressed: _loadServices,
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadServices,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // الخدمة الحالية
                        if (_currentService != null) ...[
                          _buildCurrentServiceCard(),
                          const SizedBox(height: 16),
                        ],
                        
                        // الخدمات المتاحة
                        _buildAvailableServicesSection(),
                        
                        const SizedBox(height: 16),
                        
                        // قسم الترقية
                        _buildUpgradeSection(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildCurrentServiceCard() {
    final service = _currentService!;
    final serviceName = service['name'] ?? 'غير محدد';
    final speed = service['speed'] ?? 'غير محدد';
    final dataLimit = service['data_limit'] ?? 0;
    final price = service['price'] ?? 0;
    final expiryDate = service['expiry_date'] ?? '';
    final isActive = service['is_active'] ?? false;

    return Card(
      elevation: 4,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [
              Colors.blue.shade600,
              Colors.blue.shade800,
            ],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'الخدمة الحالية',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isActive ? 'نشط' : 'غير نشط',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              Text(
                serviceName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: _buildServiceDetailItem(
                      'السرعة',
                      speed,
                      Icons.speed,
                    ),
                  ),
                  Expanded(
                    child: _buildServiceDetailItem(
                      'البيانات',
                      _formatDataSize(dataLimit),
                      Icons.data_usage,
                    ),
                  ),
                  Expanded(
                    child: _buildServiceDetailItem(
                      'السعر',
                      _formatCurrency(price),
                      Icons.attach_money,
                    ),
                  ),
                ],
              ),
              
              if (expiryDate.isNotEmpty) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.schedule, color: Colors.white70, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'ينتهي في: ${_formatDate(expiryDate)}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceDetailItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildAvailableServicesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الخدمات المتاحة',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        
        if (_services.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.build, size: 48, color: Colors.grey),
                    SizedBox(height: 8),
                    Text(
                      'لا توجد خدمات متاحة حالياً',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _services.length,
            itemBuilder: (context, index) {
              final service = _services[index];
              return _buildServiceCard(service);
            },
          ),
      ],
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final serviceName = service['name'] ?? 'غير محدد';
    final description = service['description'] ?? '';
    final speed = service['speed'] ?? 'غير محدد';
    final dataLimit = service['data_limit'] ?? 0;
    final price = service['price'] ?? 0;
    final isRecommended = service['is_recommended'] ?? false;
    final features = service['features'] as List<dynamic>? ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        serviceName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Text(
                      _formatCurrency(price),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade600,
                      ),
                    ),
                  ],
                ),
                
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ],
                
                const SizedBox(height: 12),
                
                Row(
                  children: [
                    Expanded(
                      child: _buildServiceFeature('السرعة', speed, Icons.speed),
                    ),
                    Expanded(
                      child: _buildServiceFeature('البيانات', _formatDataSize(dataLimit), Icons.data_usage),
                    ),
                  ],
                ),
                
                if (features.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'المميزات:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  ...features.map((feature) => Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Row(
                      children: [
                        Icon(Icons.check, color: Colors.green, size: 16),
                        const SizedBox(width: 4),
                        Expanded(child: Text(feature.toString())),
                      ],
                    ),
                  )),
                ],
                
                const SizedBox(height: 16),
                
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _subscribeToService(service),
                        child: const Text('اشتراك'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: () => _showServiceDetails(service),
                      child: const Text('تفاصيل'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          if (isRecommended)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: const BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: const Text(
                  'موصى به',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildServiceFeature(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUpgradeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.upgrade, color: Colors.blue.shade600),
                const SizedBox(width: 8),
                const Text(
                  'ترقية الخدمة',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'هل تحتاج سرعة أعلى أو بيانات أكثر؟ يمكنك ترقية خدمتك الحالية أو التبديل إلى خطة أفضل.',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _showUpgradeOptions,
                    icon: const Icon(Icons.trending_up),
                    label: const Text('خيارات الترقية'),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _contactSupport,
                  icon: const Icon(Icons.support_agent),
                  label: const Text('اتصل بنا'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _subscribeToService(Map<String, dynamic> service) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الاشتراك'),
        content: Text('هل تريد الاشتراك في خدمة ${service['name']}؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processSubscription(service);
            },
            child: const Text('تأكيد'),
          ),
        ],
      ),
    );
  }

  void _processSubscription(Map<String, dynamic> service) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('جاري معالجة طلب الاشتراك...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showServiceDetails(Map<String, dynamic> service) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(service['name'] ?? 'تفاصيل الخدمة'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('الوصف: ${service['description'] ?? 'غير متوفر'}'),
              const SizedBox(height: 8),
              Text('السرعة: ${service['speed'] ?? 'غير محدد'}'),
              const SizedBox(height: 8),
              Text('البيانات: ${_formatDataSize(service['data_limit'] ?? 0)}'),
              const SizedBox(height: 8),
              Text('السعر: ${_formatCurrency(service['price'] ?? 0)}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  void _showUpgradeOptions() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('سيتم إضافة خيارات الترقية قريباً...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _contactSupport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('جاري الاتصال بفريق الدعم...'),
        backgroundColor: Colors.green,
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

  String _formatCurrency(dynamic amount) {
    final double value = double.tryParse(amount.toString()) ?? 0;
    final formatter = NumberFormat.currency(
      locale: 'ar_SA',
      symbol: 'ر.س',
      decimalDigits: 0,
    );
    return formatter.format(value);
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