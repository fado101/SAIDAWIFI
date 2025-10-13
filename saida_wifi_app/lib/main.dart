import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'pages/login_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/invoices_page.dart';
import 'pages/usage_page.dart';
import 'pages/hierarchical_usage_page.dart';
import 'pages/services_page.dart';
import 'pages/routers_page.dart';
import 'pages/connection_test_page.dart';
import 'api/api_service.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SAIDA WiFi Manager',
      debugShowCheckedModeBanner: false,
      
      // دعم اللغة العربية و RTL
      locale: const Locale('ar', 'SA'),
      supportedLocales: const [
        Locale('ar', 'SA'),
        Locale('en', 'US'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      
      // تفعيل RTL
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
      
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1976D2),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'Arial', // يمكن تغييرها لخط عربي أفضل
      ),
      
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends ConsumerStatefulWidget {
  const AuthWrapper({super.key});

  @override
  ConsumerState<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends ConsumerState<AuthWrapper> {
  final ApiService _apiService = ApiService();
  bool _isChecking = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final loggedIn = await _apiService.isLoggedIn();
    setState(() {
      _isLoggedIn = loggedIn;
      _isChecking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isLoggedIn ? const MainNavigationWrapper() : const LoginPage();
  }
}

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 2; // البداية من الرئيسية (في الوسط)

  final List<Widget> _pages = [
    const UsagePage(),          // 0 - التقارير
    const ServicesPage(),       // 1 - الخدمات
    const DashboardPage(),      // 2 - الرئيسية
    const InvoicesPage(),       // 3 - الفواتير
    const ConnectionTestPage(), // 4 - اختبار الاتصال
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics),
            label: 'التقارير',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build),
            label: 'الخدمات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt),
            label: 'الفواتير',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.network_check),
            label: 'الاختبار',
          ),
        ],
      ),
    );
  }
}