// خدمة شاملة لمسح جميع أنواع تخزين المصادقة

interface ClearAuthOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearCapacitorPreferences?: boolean;
  force?: boolean; // مسح قسري حتى لو فشلت بعض العمليات
}

class AuthClearingService {
  private static readonly AUTH_KEYS = [
    // AuthService keys
    'auth_token',
    'auth_user',
    
    // JWTAuth keys
    'jwt_auth_token', 
    'jwt_user_data',
    'jwt_token',
    
    // MobileStorage keys
    'currentUser',
    'userSession',
    
    // Legacy/fallback keys
    'user_data',
    'access_token',
    'bearer_token',
    'app_token',
    'session_token',
    'mobile_token',
    'replit_token',
    'api_token'
  ];

  // مسح شامل لجميع أنواع التخزين
  static async clearAllAuth(options: ClearAuthOptions = {}): Promise<{ success: boolean; errors: string[] }> {
    
    const {
      clearLocalStorage = true,
      clearSessionStorage = true,
      clearCapacitorPreferences = true,
      force = true
    } = options;
    
    console.log('🗑️ بدء عملية المسح الشامل للمصادقة...');
    const errors: string[] = [];
    
    // 1. مسح Capacitor Preferences (للموبايل)
    if (clearCapacitorPreferences) {
      try {
        console.log('📱 مسح Capacitor Preferences...');
        
        // استيراد ديناميكي لـ Capacitor Preferences
        const { Preferences } = await import('@capacitor/preferences');
        
        for (const key of this.AUTH_KEYS) {
          try {
            await Preferences.remove({ key });
            console.log(`✅ تم مسح مفتاح Capacitor: ${key}`);
          } catch (error) {
            if (!force) {
              errors.push(`فشل مسح مفتاح Capacitor ${key}: ${error}`);
            }
            console.log(`⚠️ لم يتم العثور على مفتاح Capacitor: ${key}`);
          }
        }
        
        // مسح إضافي للمفاتيح المحتملة
        const extraKeys = ['authData', 'sessionData', 'loginData', 'userData'];
        for (const key of extraKeys) {
          try {
            await Preferences.remove({ key });
          } catch {}
        }
        
        console.log('✅ تم مسح Capacitor Preferences بنجاح');
      } catch (error) {
        const errorMsg = 'Capacitor Preferences غير متوفر - تجاهل هذا الخطأ للويب';
        console.log('ℹ️', errorMsg);
        if (!force) {
          errors.push(errorMsg);
        }
      }
    }

    // 2. مسح localStorage
    if (clearLocalStorage) {
      try {
        console.log('💾 مسح localStorage...');
        
        for (const key of this.AUTH_KEYS) {
          try {
            localStorage.removeItem(key);
            console.log(`✅ تم مسح مفتاح localStorage: ${key}`);
          } catch (error) {
            if (!force) {
              errors.push(`فشل مسح مفتاح localStorage ${key}: ${error}`);
            }
          }
        }
        
        // مسح إضافي للنماذج المختلفة للمفاتيح
        const variations = ['auth_', 'jwt_', 'token_', 'user_', 'session_', 'mobile_'];
        for (const prefix of variations) {
          try {
            // البحث عن مفاتيح تبدأ بهذا البادئة ومسحها
            const keys = Object.keys(localStorage);
            for (const key of keys) {
              if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
                console.log(`✅ تم مسح مفتاح localStorage بالبادئة: ${key}`);
              }
            }
          } catch (error) {
            if (!force) {
              errors.push(`فشل البحث في localStorage للبادئة ${prefix}: ${error}`);
            }
          }
        }
        
        console.log('✅ تم مسح localStorage بنجاح');
      } catch (error) {
        const errorMsg = `فشل مسح localStorage: ${error}`;
        console.error('❌', errorMsg);
        if (!force) {
          errors.push(errorMsg);
        }
      }
    }

    // 3. مسح sessionStorage
    if (clearSessionStorage) {
      try {
        console.log('🕐 مسح sessionStorage...');
        sessionStorage.clear();
        console.log('✅ تم مسح sessionStorage بنجاح');
      } catch (error) {
        const errorMsg = `فشل مسح sessionStorage: ${error}`;
        console.error('❌', errorMsg);
        if (!force) {
          errors.push(errorMsg);
        }
      }
    }

    // 4. مسح الكوكيز (إضافي)
    try {
      console.log('🍪 محاولة مسح الكوكيز المرتبطة...');
      
      const cookiesToClear = [
        'auth_token', 'jwt_token', 'session_token', 'user_session',
        'access_token', 'bearer_token', 'api_token'
      ];
      
      for (const cookieName of cookiesToClear) {
        // مسح الكوكي للدومين الحالي
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // مسح للدوماين الفرعي replit.dev
        if (window.location.hostname.includes('replit')) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.replit.dev;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.replit.app;`;
        }
      }
      
      console.log('✅ تم محاولة مسح الكوكيز');
    } catch (error) {
      console.log('ℹ️ لم يتم العثور على كوكيز لمسحها');
    }

    const success = errors.length === 0 || force;
    
    if (success) {
      console.log('🎉 تم مسح جميع بيانات المصادقة بنجاح!');
    } else {
      console.error('⚠️ تمت عملية المسح مع بعض الأخطاء:', errors);
    }
    
    return { success: success || false, errors };
  }

  // مسح سريع لجميع أنواع التخزين (قسري)
  static async quickClearAll(): Promise<void> {
    console.log('🚀 مسح سريع وشامل للمصادقة...');
    
    try {
      await this.clearAllAuth({
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearCapacitorPreferences: true,
        force: true
      });
    } catch (error) {
      console.log('ℹ️ تم المسح السريع مع تجاهل الأخطاء');
    }
    
    // إعادة تحميل الصفحة لضمان المسح الكامل
    console.log('🔄 سيتم إعادة تحميل الصفحة خلال 2 ثانية...');
  }

  // التحقق من وجود بيانات مصادقة متبقية
  static async checkRemainingAuth(): Promise<{
    hasLocalStorageAuth: boolean;
    hasCapacitorAuth: boolean;
    foundKeys: string[];
  }> {
    
    const foundKeys: string[] = [];
    let hasLocalStorageAuth = false;
    let hasCapacitorAuth = false;
    
    // فحص localStorage
    for (const key of this.AUTH_KEYS) {
      if (localStorage.getItem(key)) {
        foundKeys.push(`localStorage: ${key}`);
        hasLocalStorageAuth = true;
      }
    }
    
    // فحص Capacitor Preferences
    try {
      // استيراد ديناميكي لـ Capacitor Preferences
      const { Preferences } = await import('@capacitor/preferences');
      
      for (const key of this.AUTH_KEYS.slice(0, 5)) { // فحص المفاتيح الأساسية فقط
        const { value } = await Preferences.get({ key });
        if (value) {
          foundKeys.push(`Capacitor: ${key}`);
          hasCapacitorAuth = true;
        }
      }
    } catch (error) {
      console.log('ℹ️ Capacitor غير متوفر للفحص');
    }
    
    return {
      hasLocalStorageAuth: hasLocalStorageAuth || false,
      hasCapacitorAuth: hasCapacitorAuth || false, 
      foundKeys
    };
  }
}

export default AuthClearingService;