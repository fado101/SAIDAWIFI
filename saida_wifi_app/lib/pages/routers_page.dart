import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_service.dart';

class RoutersPage extends ConsumerStatefulWidget {
  const RoutersPage({super.key});

  @override
  ConsumerState<RoutersPage> createState() => _RoutersPageState();
}

class _RoutersPageState extends ConsumerState<RoutersPage> {
  final ApiService _apiService = ApiService();
  List<dynamic> _routers = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRoutersData();
  }

  Future<void> _loadRoutersData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getRoutersData(username);
        
        setState(() {
          if (result['success'] == true) {
            _routers = result['data'] ?? [];
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
        _error = 'خطأ في تحميل بيانات الراوترات: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إدارة الراوترات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadRoutersData,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showRouterSettings,
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
                        onPressed: _loadRoutersData,
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadRoutersData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // أدوات التحكم السريع
                        _buildQuickControls(),
                        
                        const SizedBox(height: 16),
                        
                        // معلومات الراوتر الرئيسي
                        _buildMainRouterInfo(),
                        
                        const SizedBox(height: 16),
                        
                        // قائمة الراوترات
                        _buildRoutersList(),
                        
                        const SizedBox(height: 16),
                        
                        // إعدادات الشبكة
                        _buildNetworkSettings(),
                        
                        const SizedBox(height: 16),
                        
                        // أدوات التشخيص
                        _buildDiagnosticTools(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildQuickControls() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'التحكم السريع',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _restartRouter,
                    icon: const Icon(Icons.restart_alt),
                    label: const Text('إعادة تشغيل'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _resetRouter,
                    icon: const Icon(Icons.refresh),
                    label: const Text('إعادة ضبط'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _speedTest,
                    icon: const Icon(Icons.speed),
                    label: const Text('اختبار السرعة'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showQRCode,
                    icon: const Icon(Icons.qr_code),
                    label: const Text('QR كود'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMainRouterInfo() {
    // في حالة عدم وجود بيانات حقيقية، نعرض بيانات تجريبية
    final mainRouter = _routers.isNotEmpty ? _routers[0] : {
      'name': 'الراوتر الرئيسي',
      'model': 'غير محدد',
      'ip_address': '192.168.1.1',
      'status': 'online',
      'uptime': '24:30:15',
      'connected_devices': 8,
      'signal_strength': 85,
    };

    final isOnline = mainRouter['status'] == 'online';
    final signalStrength = mainRouter['signal_strength'] ?? 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'الراوتر الرئيسي',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isOnline ? Colors.green : Colors.red,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isOnline ? 'متصل' : 'غير متصل',
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
            
            Row(
              children: [
                Expanded(
                  child: _buildRouterInfoItem(
                    'الموديل',
                    mainRouter['model'] ?? 'غير محدد',
                    Icons.router,
                  ),
                ),
                Expanded(
                  child: _buildRouterInfoItem(
                    'عنوان IP',
                    mainRouter['ip_address'] ?? 'غير محدد',
                    Icons.language,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildRouterInfoItem(
                    'وقت التشغيل',
                    mainRouter['uptime'] ?? '00:00:00',
                    Icons.schedule,
                  ),
                ),
                Expanded(
                  child: _buildRouterInfoItem(
                    'الأجهزة المتصلة',
                    '${mainRouter['connected_devices'] ?? 0}',
                    Icons.devices,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // قوة الإشارة
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('قوة الإشارة'),
                    Text(
                      '$signalStrength%',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _getSignalColor(signalStrength),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: signalStrength / 100,
                  backgroundColor: Colors.grey.shade300,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getSignalColor(signalStrength),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouterInfoItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildRoutersList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'جميع الراوترات',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        
        if (_routers.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.router, size: 48, color: Colors.grey),
                    SizedBox(height: 8),
                    Text(
                      'لا توجد راوترات مسجلة',
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
            itemCount: _routers.length,
            itemBuilder: (context, index) {
              final router = _routers[index];
              return _buildRouterCard(router);
            },
          ),
      ],
    );
  }

  Widget _buildRouterCard(Map<String, dynamic> router) {
    final routerName = router['name'] ?? 'راوتر غير محدد';
    final isOnline = router['status'] == 'online';
    final ipAddress = router['ip_address'] ?? 'غير محدد';
    final connectedDevices = router['connected_devices'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isOnline ? Colors.green.shade100 : Colors.red.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            Icons.router,
            color: isOnline ? Colors.green.shade700 : Colors.red.shade700,
          ),
        ),
        title: Text(routerName),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('IP: $ipAddress'),
            Text('الأجهزة المتصلة: $connectedDevices'),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isOnline ? Colors.green : Colors.red,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isOnline ? 'متصل' : 'غير متصل',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        onTap: () => _showRouterDetails(router),
      ),
    );
  }

  Widget _buildNetworkSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'إعدادات الشبكة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            ListTile(
              leading: const Icon(Icons.wifi),
              title: const Text('إعدادات WiFi'),
              subtitle: const Text('تغيير اسم الشبكة وكلمة المرور'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: _showWiFiSettings,
            ),
            
            const Divider(),
            
            ListTile(
              leading: const Icon(Icons.security),
              title: const Text('الأمان'),
              subtitle: const Text('إعدادات الحماية والتشفير'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: _showSecuritySettings,
            ),
            
            const Divider(),
            
            ListTile(
              leading: const Icon(Icons.block),
              title: const Text('حظر المواقع'),
              subtitle: const Text('إدارة المواقع المحظورة'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: _showBlockedSites,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDiagnosticTools() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'أدوات التشخيص',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _runPingTest,
                    icon: const Icon(Icons.network_ping),
                    label: const Text('اختبار Ping'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showNetworkMap,
                    icon: const Icon(Icons.map),
                    label: const Text('خريطة الشبكة'),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showLogs,
                    icon: const Icon(Icons.list_alt),
                    label: const Text('سجل الأحداث'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _exportSettings,
                    icon: const Icon(Icons.download),
                    label: const Text('تصدير الإعدادات'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getSignalColor(int strength) {
    if (strength >= 75) return Colors.green;
    if (strength >= 50) return Colors.orange;
    return Colors.red;
  }

  // وظائف التحكم في الراوتر
  void _restartRouter() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إعادة تشغيل الراوتر'),
        content: const Text('هل تريد إعادة تشغيل الراوتر؟ قد يستغرق الأمر دقيقتين.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processRouterRestart();
            },
            child: const Text('إعادة تشغيل'),
          ),
        ],
      ),
    );
  }

  void _resetRouter() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إعادة ضبط الراوتر'),
        content: const Text('تحذير: سيتم فقدان جميع الإعدادات المخصصة. هل تريد المتابعة؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processRouterReset();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('إعادة ضبط'),
          ),
        ],
      ),
    );
  }

  void _processRouterRestart() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('جاري إعادة تشغيل الراوتر...'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  void _processRouterReset() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('جاري إعادة ضبط الراوتر...'),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _speedTest() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('بدء اختبار السرعة...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showQRCode() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('QR كود الشبكة'),
        content: const SizedBox(
          width: 200,
          height: 200,
          child: Center(
            child: Icon(Icons.qr_code, size: 150, color: Colors.grey),
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

  void _showRouterSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('فتح إعدادات الراوتر...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showRouterDetails(Map<String, dynamic> router) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(router['name'] ?? 'تفاصيل الراوتر'),
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('الموديل: ${router['model'] ?? 'غير محدد'}'),
            Text('عنوان IP: ${router['ip_address'] ?? 'غير محدد'}'),
            Text('الحالة: ${router['status'] == 'online' ? 'متصل' : 'غير متصل'}'),
            Text('الأجهزة المتصلة: ${router['connected_devices'] ?? 0}'),
          ],
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

  void _showWiFiSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('فتح إعدادات WiFi...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showSecuritySettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('فتح إعدادات الأمان...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showBlockedSites() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('فتح قائمة المواقع المحظورة...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _runPingTest() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تشغيل اختبار Ping...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showNetworkMap() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('عرض خريطة الشبكة...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showLogs() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('عرض سجل الأحداث...'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _exportSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تصدير الإعدادات...'),
        backgroundColor: Colors.green,
      ),
    );
  }
}