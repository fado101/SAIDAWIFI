class YearUsageData {
  final int year;
  final int totalSessions;
  final double totalGb;
  final int totalDuration;

  YearUsageData({
    required this.year,
    required this.totalSessions,
    required this.totalGb,
    required this.totalDuration,
  });

  factory YearUsageData.fromJson(Map<String, dynamic> json) {
    return YearUsageData(
      year: json['year'] ?? 0,
      totalSessions: json['total_sessions'] ?? 0,
      totalGb: (json['total_gb'] is String) 
          ? double.tryParse(json['total_gb']) ?? 0.0 
          : (json['total_gb']?.toDouble() ?? 0.0),
      totalDuration: json['total_duration'] ?? 0,
    );
  }
}

class MonthUsageData {
  final int month;
  final String monthName;
  final int totalSessions;
  final double totalGb;
  final int totalDuration;

  MonthUsageData({
    required this.month,
    required this.monthName,
    required this.totalSessions,
    required this.totalGb,
    required this.totalDuration,
  });

  factory MonthUsageData.fromJson(Map<String, dynamic> json) {
    return MonthUsageData(
      month: json['month'] ?? 0,
      monthName: json['month_name'] ?? '',
      totalSessions: json['total_sessions'] ?? 0,
      totalGb: (json['total_gb'] is String) 
          ? double.tryParse(json['total_gb']) ?? 0.0 
          : (json['total_gb']?.toDouble() ?? 0.0),
      totalDuration: json['total_duration'] ?? 0,
    );
  }
}

class DayUsageData {
  final int day;
  final String date;
  final int totalSessions;
  final double totalGb;
  final int totalDuration;

  DayUsageData({
    required this.day,
    required this.date,
    required this.totalSessions,
    required this.totalGb,
    required this.totalDuration,
  });

  factory DayUsageData.fromJson(Map<String, dynamic> json) {
    return DayUsageData(
      day: json['day'] ?? 0,
      date: json['date'] ?? '',
      totalSessions: json['total_sessions'] ?? 0,
      totalGb: (json['total_gb'] is String) 
          ? double.tryParse(json['total_gb']) ?? 0.0 
          : (json['total_gb']?.toDouble() ?? 0.0),
      totalDuration: json['total_duration'] ?? 0,
    );
  }
}

class SessionData {
  final int radacctid;
  final String acctstarttime;
  final String? acctstoptime;
  final int acctsessiontime;
  final double downloadMb;
  final double uploadMb;
  final double totalMb;
  final String? nasipaddress;
  final String? framedipaddress;

  SessionData({
    required this.radacctid,
    required this.acctstarttime,
    this.acctstoptime,
    required this.acctsessiontime,
    required this.downloadMb,
    required this.uploadMb,
    required this.totalMb,
    this.nasipaddress,
    this.framedipaddress,
  });

  factory SessionData.fromJson(Map<String, dynamic> json) {
    return SessionData(
      radacctid: json['radacctid'] ?? 0,
      acctstarttime: json['acctstarttime'] ?? '',
      acctstoptime: json['acctstoptime'],
      acctsessiontime: json['acctsessiontime'] ?? 0,
      downloadMb: (json['download_mb'] is String) 
          ? double.tryParse(json['download_mb']) ?? 0.0 
          : (json['download_mb']?.toDouble() ?? 0.0),
      uploadMb: (json['upload_mb'] is String) 
          ? double.tryParse(json['upload_mb']) ?? 0.0 
          : (json['upload_mb']?.toDouble() ?? 0.0),
      totalMb: (json['total_mb'] is String) 
          ? double.tryParse(json['total_mb']) ?? 0.0 
          : (json['total_mb']?.toDouble() ?? 0.0),
      nasipaddress: json['nasipaddress'],
      framedipaddress: json['framedipaddress'],
    );
  }
}