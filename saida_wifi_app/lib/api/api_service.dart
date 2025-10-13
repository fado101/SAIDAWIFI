import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // عنوان السيرفر السوري الصحيح
  static const String baseUrl = 'http://108.181.215.206:3000/api';
  
  // Headers أساسية
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'SAIDA-WiFi-Flutter/1.0',
  };

  // Headers مع Authentication
  Future<Map<String, String>> get _authHeaders async {
    final token = await getJwtToken();
    return {
      ..._headers,
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // تسجيل الدخول
  Future<Map<String, dynamic>> loginUser(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: _headers,
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 45));
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // حفظ بيانات المستخدم
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('username', username);
        await prefs.setBool('isLoggedIn', true);
        
        // حفظ JWT Token
        if (data['token'] != null) {
          await prefs.setString('jwt_token', data['token']);
        }
        
        return data;
      } else {
        return {'success': false, 'message': data['message'] ?? 'خطأ في تسجيل الدخول'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة: تحقق من الاتصال بالإنترنت'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات لوحة التحكم
  Future<Map<String, dynamic>> getDashboardData() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout(); // تسجيل خروج تلقائي
        return {'success': false, 'message': 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب البيانات (${response.statusCode})'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة: تحقق من الاتصال بالإنترنت'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب البيانات المتبقية المفصلة
  Future<Map<String, dynamic>> getRemainingData() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/remaining-detailed'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب البيانات المتبقية'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب الفواتير
  Future<Map<String, dynamic>> getInvoices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/invoices'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب الفواتير'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات الاستخدام - السنوات
  Future<Map<String, dynamic>> getUsageYears() async {
    try {
      final username = await getSavedUsername();
      if (username == null) return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      
      final response = await http.get(
        Uri.parse('$baseUrl/usage/years/$username'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات السنوات'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات الاستخدام - الشهور
  Future<Map<String, dynamic>> getUsageMonths(int year) async {
    try {
      final username = await getSavedUsername();
      if (username == null) return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      
      final response = await http.get(
        Uri.parse('$baseUrl/usage/months/$username/$year'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات الشهور'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات الاستخدام - الأيام
  Future<Map<String, dynamic>> getUsageDays(int year, int month) async {
    try {
      final username = await getSavedUsername();
      if (username == null) return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      
      final response = await http.get(
        Uri.parse('$baseUrl/usage/days/$username/$year/$month'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات الأيام'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات الاستخدام - الجلسات
  Future<Map<String, dynamic>> getUsageSessions(int year, int month, int day) async {
    try {
      final username = await getSavedUsername();
      if (username == null) return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      
      final response = await http.get(
        Uri.parse('$baseUrl/usage/sessions/$username/$year/$month/$day'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات الجلسات'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // اختبار الاتصال بالسيرفر
  Future<Map<String, dynamic>> testConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true, 
          'message': 'الاتصال بالسيرفر السوري نجح ✅',
          'server': '108.181.215.206:3000',
          'data': data
        };
      } else {
        return {
          'success': false, 
          'message': 'السيرفر يستجيب ولكن هناك خطأ (${response.statusCode})'
        };
      }
    } on http.ClientException catch (e) {
      return {
        'success': false, 
        'message': 'خطأ في الشبكة: تحقق من الاتصال بالإنترنت والشبكة السورية'
      };
    } catch (e) {
      return {
        'success': false, 
        'message': 'خطأ في الاتصال بالسيرفر السوري: ${e.toString()}'
      };
    }
  }

  // تسجيل الخروج
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // التحقق من حالة تسجيل الدخول
  Future<bool> isLoggedIn() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
      final token = prefs.getString('jwt_token');
      
      if (!isLoggedIn || token == null) {
        return false;
      }
      
      // التحقق من صلاحية التوكن
      final response = await http.get(
        Uri.parse('$baseUrl/auth/user'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      } else {
        await logout(); // تسجيل خروج تلقائي
        return false;
      }
    } catch (e) {
      // في حالة عدم توفر الشبكة، اعتمد على البيانات المحلية
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('isLoggedIn') ?? false;
    }
  }

  // جلب اسم المستخدم المحفوظ
  Future<String?> getSavedUsername() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('username');
  }

  // جلب JWT Token المحفوظ
  Future<String?> getJwtToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  // حفظ JWT Token
  Future<void> saveJwtToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }

  // === دوال إضافية مطلوبة للصفحات ===

  // جلب بيانات الاستخدام العامة
  Future<Map<String, dynamic>> getUsageData(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/usage/$username'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات الاستخدام'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب السنوات (alias للدالة الموجودة)
  Future<Map<String, dynamic>> getYearsUsage(String username) async {
    return await getUsageYears();
  }

  // جلب الشهور (alias للدالة الموجودة)
  Future<Map<String, dynamic>> getMonthsUsage(String username, int year) async {
    return await getUsageMonths(year);
  }

  // جلب الأيام (alias للدالة الموجودة)
  Future<Map<String, dynamic>> getDaysUsage(String username, int year, int month) async {
    return await getUsageDays(year, month);
  }

  // جلب الجلسات (alias للدالة الموجودة)
  Future<Map<String, dynamic>> getSessionsUsage(String username, int year, int month, int day) async {
    return await getUsageSessions(year, month, day);
  }

  // جلب الخدمات
  Future<Map<String, dynamic>> getServices(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/services'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات الخدمات'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }

  // جلب بيانات أجهزة التوجيه
  Future<Map<String, dynamic>> getRoutersData(String username) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/routers'),
        headers: await _authHeaders,
      ).timeout(const Duration(seconds: 45));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        await logout();
        return {'success': false, 'message': 'انتهت صلاحية الجلسة'};
      } else {
        return {'success': false, 'message': 'خطأ في جلب بيانات أجهزة التوجيه'};
      }
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'خطأ في الشبكة'};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال: ${e.toString()}'};
    }
  }
}