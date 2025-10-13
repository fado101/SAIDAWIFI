// صفحة تشخيص للتحقق من إعدادات النظام
import { useEffect, useState } from 'react';
import { API_CONFIG, DIRECT_API } from '@/config/api';
import authService from '@/services/authService';

export function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({
    hostname: '',
    isProductionDomain: false,
    baseUrl: '',
    loginUrl: '',
    apis: {},
    userAgent: ''
  });

  useEffect(() => {
    const isProductionDomain = window.location.hostname === "saidawifi.com";
    
    setDebugInfo({
      hostname: window.location.hostname,
      isProductionDomain,
      baseUrl: API_CONFIG.BASE_URL,
      loginUrl: isProductionDomain ? DIRECT_API.login : '/api/login',
      apis: DIRECT_API,
      userAgent: navigator.userAgent
    });
  }, []);

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">معلومات التشخيص</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">معلومات النطاق:</h2>
          <p><strong>المضيف:</strong> {debugInfo.hostname}</p>
          <p><strong>هل هو نطاق الإنتاج؟:</strong> {debugInfo.isProductionDomain ? 'نعم' : 'لا'}</p>
          <p><strong>Base URL:</strong> {debugInfo.baseUrl}</p>
          <p><strong>Login URL:</strong> {debugInfo.loginUrl}</p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">APIs المباشر:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.apis, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">معلومات المتصفح:</h2>
          <p className="text-sm break-all">{debugInfo.userAgent}</p>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
          <h2 className="font-bold mb-2">اختبار API:</h2>
          <button 
            onClick={async () => {
              const loginUrl = debugInfo.isProductionDomain ? DIRECT_API.login : '/api/login';
              console.log('🔗 Testing API URL:', loginUrl);
              
              try {
                const response = await fetch(loginUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': debugInfo.isProductionDomain ? 'application/x-www-form-urlencoded' : 'application/json',
                  },
                  body: debugInfo.isProductionDomain 
                    ? 'username=test&password=test'
                    : JSON.stringify({ username: 'test', password: 'test' }),
                });
                console.log('📥 Response status:', response.status);
                console.log('📄 Response:', await response.text());
              } catch (error) {
                console.error('❌ Error:', error);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            اختبار الاتصال
          </button>
        </div>

        <div className="bg-red-100 dark:bg-red-900 p-4 rounded">
          <h2 className="font-bold mb-2">🧹 تنظيف البيانات:</h2>
          <p className="mb-4 text-sm">إذا كنت ترى بيانات مستخدم آخر أو بيانات خاطئة، انقر هنا لمسح جميع البيانات المحفوظة وإعادة تسجيل الدخول:</p>
          <button 
            onClick={async () => {
              if (confirm('هل أنت متأكد؟ سيتم تسجيل خروجك وحذف جميع البيانات المحفوظة.')) {
                // مسح جميع بيانات المصادقة المحفوظة
                await authService.logout();
                
                // مسح localStorage أيضاً
                localStorage.clear();
                sessionStorage.clear();
                
                // مسح أي بيانات مخبئة في الكوكيز
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                alert('✅ تم مسح جميع البيانات المحفوظة. سيتم إعادة تحميل الصفحة...');
                setTimeout(() => window.location.reload(), 1000);
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            🧹 مسح جميع البيانات وإعادة تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}