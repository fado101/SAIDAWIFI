import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:saida_wifi_app/main.dart';

void main() {
  testWidgets('SAIDA WiFi App smoke test', (WidgetTester tester) async {
    // بناء التطبيق والانتظار للإطار الأول
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // التحقق من وجود عنوان التطبيق
    expect(find.text('شبكة صيدا WiFi'), findsOneWidget);
    
    // التحقق من وجود حقول تسجيل الدخول
    expect(find.byType(TextFormField), findsAtLeast(2));
    
    // التحقق من وجود زر تسجيل الدخول
    expect(find.text('تسجيل الدخول'), findsOneWidget);
  });

  testWidgets('Login form validation test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // العثور على زر تسجيل الدخول والضغط عليه بدون ملء البيانات
    final loginButton = find.text('تسجيل الدخول');
    await tester.tap(loginButton);
    await tester.pump();

    // التحقق من ظهور رسائل التحقق من صحة البيانات
    expect(find.text('يرجى إدخال اسم المستخدم'), findsOneWidget);
    expect(find.text('يرجى إدخال كلمة المرور'), findsOneWidget);
  });

  testWidgets('RTL support test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // التحقق من أن التطبيق يدعم RTL
    final BuildContext context = tester.element(find.byType(MaterialApp));
    expect(Directionality.of(context), TextDirection.rtl);
  });

  testWidgets('App theme test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // التحقق من وجود المظهر المطلوب
    final MaterialApp app = tester.widget(find.byType(MaterialApp));
    expect(app.theme, isNotNull);
    expect(app.locale, const Locale('ar', 'SA'));
  });
}