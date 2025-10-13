// خدمة المصادقة الآمنة باستخدام JWT موقع من الخادم فقط
import { API_CONFIG, DIRECT_API } from '../config/api';
import { isDirectAPIEnvironment } from '../lib/environmentDetector';

interface User {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private baseURL = '';

  constructor() {
    this.loadStoredAuth();
  }

  // التحقق من صحة التوكن المحفوظ
  private async validateStoredToken(token: string): Promise<boolean> {
    try {
      // محاولة فك تشفير التوكن للتحقق من صحته
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // التحقق من انتهاء صلاحية التوكن
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log('⏰ Stored token has expired');
        return false;
      }
      
      // محاولة التحقق من التوكن مع السيرفر باستخدام نفس منطق الـ routing
      const apiUrl = this.getAPIUrl('/api/auth/user');
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log('🚫 Stored token is invalid (server validation failed)');
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('❌ Error validating stored token:', error);
      return false;
    }
  }

  // تحميل التوكن المحفوظ من الذاكرة
  async loadStoredAuth() {
    try {
      // محاولة تحميل من Capacitor Preferences (للموبايل) - استيراد ديناميكي لتحسين الأداء
      const { Preferences } = await import('@capacitor/preferences');
      const { value: token } = await Preferences.get({ key: 'auth_token' });
      const { value: userStr } = await Preferences.get({ key: 'auth_user' });
      
      if (token && userStr) {
        // التحقق من صحة التوكن قبل استخدامه
        const isValid = await this.validateStoredToken(token);
        
        if (isValid) {
          this.token = token;
          this.user = JSON.parse(userStr);
          console.log('✅ Valid token loaded from Capacitor Preferences');
          return;
        } else {
          console.log('🗑️ Clearing invalid token from Capacitor Preferences');
          await this.clearAuth();
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Capacitor Preferences not available, trying localStorage');
    }

    // fallback للويب
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        // التحقق من صحة التوكن قبل استخدامه
        const isValid = await this.validateStoredToken(token);
        
        if (isValid) {
          this.token = token;
          this.user = JSON.parse(userStr);
          console.log('✅ Valid token loaded from localStorage');
        } else {
          console.log('🗑️ Clearing invalid token from localStorage');
          await this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  }

  // حفظ التوكن في الذاكرة
  private async saveAuth(token: string, user: User) {
    this.token = token;
    this.user = user;

    try {
      // حفظ في Capacitor Preferences (للموبايل) - استيراد ديناميكي
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'auth_token', value: token });
      await Preferences.set({ key: 'auth_user', value: JSON.stringify(user) });
      console.log('✅ Token saved to Capacitor Preferences');
    } catch (error) {
      console.log('⚠️ Capacitor Preferences not available, using localStorage');
      // fallback للويب
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      console.log('✅ Token saved to localStorage');
    }
  }

  // حذف التوكن من الذاكرة
  async clearAuth() {
    this.token = null;
    this.user = null;

    try {
      // حذف من Capacitor Preferences (للموبايل) - استيراد ديناميكي
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_user' });
      console.log('✅ Token cleared from Capacitor Preferences');
    } catch (error) {
      // fallback للويب
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      console.log('✅ Token cleared from localStorage');
    }
  }

  // 🔐 SECURE LOGIN: تسجيل الدخول الآمن مع JWT موقع من الخادم
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 [SECURE AUTH] Starting secure login request for:', username);
      
      // ✅ CRITICAL FIX: استخدام Node.js server في جميع البيئات لحل مشكلة النشر
      console.log('🔧 [SECURE] Using Node.js server for ALL environments');
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('📥 [SECURE] Login response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: any = await response.json();
      console.log('📄 [SECURE] Login response received successfully');

      // معالجة استجابة Node.js API
      if (data.success && data.token && data.user) {
        const { token, user: userData } = data;
        
        const user: User = {
          username: userData.username || username,
          email: userData.email || username,
          firstName: userData.firstName || username,
          lastName: userData.lastName || '',
        };

        await this.saveAuth(token, user);
        console.log('✅ [SECURE] Login successful via Node.js server');
        console.log('👤 [SECURE] User data saved:', user);
        
        return {
          success: true,
          token,
          user,
          message: 'تم تسجيل الدخول بنجاح'
        };
      } else {
        console.error('❌ [SECURE] Node.js Login failed:', data.message || data.error);
        return {
          success: false,
          message: data.message || data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة'
        };
      }
    } catch (error) {
      console.error('❌ [SECURE] Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير محدد';
      return {
        success: false,
        message: `حدث خطأ أثناء الاتصال بالخادم: ${errorMessage}`
      };
    }
  }

  // تحديد URL آمن باستخدام API_CONFIG لتجنب المشاكل الأمنية
  private getAPIUrl(url: string): string {
    // إذا كان URL كاملاً، استخدمه كما هو
    if (url.startsWith("http")) {
      return url;
    }
    
    const baseUrl = API_CONFIG.BASE_URL;
    console.log(`🔗 getAPIUrl - Input: ${url}, BASE_URL: ${baseUrl}`);
    
    // إذا كان BASE_URL هو "/api" (البيئة المحلية/Replit)، استخدم المسار مباشرة
    if (baseUrl === "/api") {
      return url;
    }
    
    // إذا كان BASE_URL ينتهي بـ "/api" وurl يبدأ بـ "/api"
    if (baseUrl.endsWith("/api") && url.startsWith("/api")) {
      return `${baseUrl}${url.slice(4)}`;
    }
    
    // خلاف ذلك، اربط BASE_URL مع المسار
    return `${baseUrl}${url}`;
  }

  // تسجيل الخروج
  async logout(): Promise<void> {
    await this.clearAuth();
    console.log('✅ Logout successful');
  }

  // التحقق من حالة تسجيل الدخول
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // الحصول على التوكن
  getToken(): string | null {
    return this.token;
  }

  // الحصول على بيانات المستخدم
  getUser(): User | null {
    return this.user;
  }

  // الحصول على Header للطلبات المحمية
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔑 Adding Authorization header');
    } else {
      console.log('⚠️ No token available for Authorization header');
    }

    return headers;
  }


  // طلب محمي عام محسن للـ APK
  async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    // تحديد الرابط الكامل للـ APK
    const fullUrl = this.getAPIUrl(url);
    console.log(`🌐 Making authenticated request to: ${fullUrl}`);
    console.log('📤 Making authenticated request');

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`📥 Response status: ${response.status}`);

    // إذا كان الرد 401 أو 403 (غير مفوض)، قم بتسجيل الخروج
    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Token expired or invalid, logging out');
      await this.logout();
    }

    return response;
  }

  // طلب GET محمي
  async get(url: string): Promise<Response> {
    return this.authenticatedRequest(url, { method: 'GET' });
  }

  // طلب POST محمي
  async post(url: string, data?: any): Promise<Response> {
    return this.authenticatedRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// إنشاء instance واحد لاستخدامه في كامل التطبيق
export const authService = new AuthService();
export default authService;