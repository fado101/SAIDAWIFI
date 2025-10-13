import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';
import '../models/usage_models.dart';

class HierarchicalUsagePage extends ConsumerStatefulWidget {
  const HierarchicalUsagePage({super.key});

  @override
  ConsumerState<HierarchicalUsagePage> createState() => _HierarchicalUsagePageState();
}

class _HierarchicalUsagePageState extends ConsumerState<HierarchicalUsagePage> {
  final ApiService _apiService = ApiService();
  
  // Navigation Stack
  final List<Map<String, dynamic>> _navigationStack = [];
  
  // Loading and Error States
  bool _isLoading = true;
  String? _error;
  
  // Data Storage
  List<YearUsageData> _years = [];
  List<MonthUsageData> _months = [];
  List<DayUsageData> _days = [];
  List<SessionData> _sessions = [];
  
  // Current Level (0=years, 1=months, 2=days, 3=sessions)
  int _currentLevel = 0;
  
  // Current Context
  int? _currentYear;
  int? _currentMonth;
  String? _currentMonthName;
  int? _currentDay;
  String? _currentDate;
  
  @override
  void initState() {
    super.initState();
    _loadYears();
  }

  // === Navigation Methods ===
  
  void _navigateToMonths(int year) {
    _navigationStack.add({
      'level': 0,
      'title': 'السنوات',
      'data': _years,
      'year': _currentYear,
      'month': _currentMonth,
      'monthName': _currentMonthName,
      'day': _currentDay,
      'date': _currentDate,
    });
    _currentLevel = 1;
    _currentYear = year;
    _currentMonth = null;
    _currentMonthName = null;
    _currentDay = null;
    _currentDate = null;
    _loadMonths(year);
  }
  
  void _navigateToDays(int year, int month, String monthName) {
    _navigationStack.add({
      'level': 1,
      'title': 'شهور $year',
      'data': _months,
      'year': _currentYear,
      'month': _currentMonth,
      'monthName': _currentMonthName,
      'day': _currentDay,
      'date': _currentDate,
    });
    _currentLevel = 2;
    _currentYear = year;
    _currentMonth = month;
    _currentMonthName = monthName;
    _currentDay = null;
    _currentDate = null;
    _loadDays(year, month);
  }
  
  void _navigateToSessions(int year, int month, int day, String date) {
    _navigationStack.add({
      'level': 2,
      'title': 'أيام ${_getMonthName(month)} $year',
      'data': _days,
      'year': _currentYear,
      'month': _currentMonth,
      'monthName': _currentMonthName,
      'day': _currentDay,
      'date': _currentDate,
    });
    _currentLevel = 3;
    _currentYear = year;
    _currentMonth = month;
    _currentDay = day;
    _currentDate = date;
    _loadSessions(year, month, day);
  }
  
  void _navigateBack() {
    if (_navigationStack.isNotEmpty) {
      final previous = _navigationStack.removeLast();
      _currentLevel = previous['level'];
      
      // استعادة السياق
      _currentYear = previous['year'];
      _currentMonth = previous['month'];
      _currentMonthName = previous['monthName'];
      _currentDay = previous['day'];
      _currentDate = previous['date'];
      
      setState(() {
        _isLoading = false;
        _error = null;
        
        switch (_currentLevel) {
          case 0:
            _years = List<YearUsageData>.from(previous['data']);
            break;
          case 1:
            _months = List<MonthUsageData>.from(previous['data']);
            break;
          case 2:
            _days = List<DayUsageData>.from(previous['data']);
            break;
        }
      });
    }
  }

  // === Data Loading Methods ===
  
  Future<void> _loadYears() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getYearsUsage(username);
        
        if (result['success'] == true) {
          final years = (result['years'] as List)
              .map((year) => YearUsageData.fromJson(year))
              .toList();
          
          setState(() {
            _years = years;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = result['message']?.toString() ?? 'خطأ غير معروف';
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = 'لم يتم العثور على بيانات المستخدم';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل بيانات السنوات: ${e.toString()}';
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadMonths(int year) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getMonthsUsage(username, year);
        
        if (result['success'] == true) {
          final months = (result['months'] as List)
              .map((month) => MonthUsageData.fromJson(month))
              .toList();
          
          setState(() {
            _months = months;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = result['message']?.toString() ?? 'خطأ غير معروف';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل بيانات الشهور: ${e.toString()}';
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadDays(int year, int month) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getDaysUsage(username, year, month);
        
        if (result['success'] == true) {
          final days = (result['days'] as List)
              .map((day) => DayUsageData.fromJson(day))
              .toList();
          
          setState(() {
            _days = days;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = result['message']?.toString() ?? 'خطأ غير معروف';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل بيانات الأيام: ${e.toString()}';
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadSessions(int year, int month, int day) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getSessionsUsage(username, year, month, day);
        
        if (result['success'] == true) {
          final sessions = (result['sessions'] as List)
              .map((session) => SessionData.fromJson(session))
              .toList();
          
          setState(() {
            _sessions = sessions;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = result['message']?.toString() ?? 'خطأ غير معروف';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        _error = 'خطأ في تحميل بيانات الجلسات: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  // === UI Building Methods ===
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_getPageTitle()),
        centerTitle: true,
        leading: _navigationStack.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _navigateBack,
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshCurrentLevel,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget()
              : _buildContentBasedOnLevel(),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
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
            onPressed: _refreshCurrentLevel,
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  Widget _buildContentBasedOnLevel() {
    switch (_currentLevel) {
      case 0:
        return _buildYearsList();
      case 1:
        return _buildMonthsList();
      case 2:
        return _buildDaysList();
      case 3:
        return _buildSessionsList();
      default:
        return _buildYearsList();
    }
  }

  // Years Level
  Widget _buildYearsList() {
    if (_years.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد بيانات استخدام متاحة',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadYears,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _years.length,
        itemBuilder: (context, index) {
          final year = _years[index];
          return _buildYearCard(year);
        },
      ),
    );
  }

  Widget _buildYearCard(YearUsageData year) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade100,
          child: Icon(
            Icons.calendar_today,
            color: Colors.blue.shade700,
          ),
        ),
        title: Text(
          '${year.year}',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.data_usage, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${year.totalGb.toStringAsFixed(2)} GB'),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${year.totalSessions} جلسة'),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () => _navigateToMonths(year.year),
      ),
    );
  }

  // Months Level
  Widget _buildMonthsList() {
    if (_months.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد بيانات شهرية متاحة',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _months.length,
      itemBuilder: (context, index) {
        final month = _months[index];
        return _buildMonthCard(month);
      },
    );
  }

  Widget _buildMonthCard(MonthUsageData month) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.green.shade100,
          child: Text(
            '${month.month}',
            style: TextStyle(
              color: Colors.green.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          _getMonthName(month.month),
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.data_usage, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${month.totalGb.toStringAsFixed(2)} GB'),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${month.totalSessions} جلسة'),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          _navigateToDays(_currentYear!, month.month, month.monthName);
        },
      ),
    );
  }

  // Days Level
  Widget _buildDaysList() {
    if (_days.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد بيانات يومية متاحة',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _days.length,
      itemBuilder: (context, index) {
        final day = _days[index];
        return _buildDayCard(day);
      },
    );
  }

  Widget _buildDayCard(DayUsageData day) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.orange.shade100,
          child: Text(
            '${day.day}',
            style: TextStyle(
              color: Colors.orange.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          _formatDate(day.date),
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.data_usage, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${day.totalGb.toStringAsFixed(2)} GB'),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('${day.totalSessions} جلسة'),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          _navigateToSessions(_currentYear!, _currentMonth!, day.day, day.date);
        },
      ),
    );
  }

  // Sessions Level
  Widget _buildSessionsList() {
    if (_sessions.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد جلسات متاحة',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _sessions.length,
      itemBuilder: (context, index) {
        final session = _sessions[index];
        return _buildSessionCard(session);
      },
    );
  }

  Widget _buildSessionCard(SessionData session) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.wifi, color: Colors.purple.shade600),
                const SizedBox(width: 8),
                Text(
                  'جلسة #${session.radacctid}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(),
            _buildSessionDetail('وقت البدء', _formatDateTime(session.acctstarttime)),
            if (session.acctstoptime != null)
              _buildSessionDetail('وقت الانتهاء', _formatDateTime(session.acctstoptime!)),
            _buildSessionDetail('مدة الجلسة', _formatDuration(session.acctsessiontime)),
            _buildSessionDetail('التحميل', '${session.downloadMb.toStringAsFixed(2)} MB'),
            _buildSessionDetail('الرفع', '${session.uploadMb.toStringAsFixed(2)} MB'),
            _buildSessionDetail('الإجمالي', '${session.totalMb.toStringAsFixed(2)} MB'),
            if (session.nasipaddress != null)
              _buildSessionDetail('عنوان NAS', session.nasipaddress!),
            if (session.framedipaddress != null)
              _buildSessionDetail('عنوان IP', session.framedipaddress!),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  // === Helper Methods ===
  
  String _getPageTitle() {
    switch (_currentLevel) {
      case 0:
        return 'تقارير الاستخدام - السنوات';
      case 1:
        return 'الاستخدام الشهري';
      case 2:
        return 'الاستخدام اليومي';
      case 3:
        return 'تفاصيل الجلسات';
      default:
        return 'تقارير الاستخدام';
    }
  }

  void _refreshCurrentLevel() {
    switch (_currentLevel) {
      case 0:
        _loadYears();
        break;
      case 1:
        if (_currentYear != null) {
          _loadMonths(_currentYear!);
        }
        break;
      case 2:
        if (_currentYear != null && _currentMonth != null) {
          _loadDays(_currentYear!, _currentMonth!);
        }
        break;
      case 3:
        if (_currentYear != null && _currentMonth != null && _currentDay != null) {
          _loadSessions(_currentYear!, _currentMonth!, _currentDay!);
        }
        break;
    }
  }

  String _getMonthName(int month) {
    const months = [
      '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month] ?? 'شهر $month';
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd/MM/yyyy', 'ar').format(date);
    } catch (e) {
      return dateString;
    }
  }

  String _formatDateTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd/MM/yyyy HH:mm', 'ar').format(date);
    } catch (e) {
      return dateString;
    }
  }

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    
    if (hours > 0) {
      return '${hours}س ${minutes}د ${secs}ث';
    } else if (minutes > 0) {
      return '${minutes}د ${secs}ث';
    } else {
      return '${secs}ث';
    }
  }
}