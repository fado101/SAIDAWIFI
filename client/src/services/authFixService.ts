// خدمة إصلاح مشاكل المصادقة في المواقع المنشورة
import AuthClearingService from './authClearingService';
import authService from './authService';

class AuthFixService {
  
  // إصلاح مشاكل المصادقة للمواقع المنشورة (حذر ومحدد)
  static async fixProductionAuthIssues(): Promise<{
    success: boolean;
    message: string;
    needsLogin: boolean;
  }> {
    
    console.log('🔧 فحص مشاكل المصادقة في الموقع المنشور...');
    
    try {
      // 1. فحص البيانات الحالية
      const currentUser = authService.getUser();
      const currentToken = authService.getToken();
      
      if (currentUser) {
        console.log('👤 المستخدم الحالي:', currentUser.username);
      }
      
      // 2. التحقق من صحة التوكن والمستخدم (بحذر)
      if (currentToken && currentUser) {
        try {
          // محاولة طلب تجريبي للتحقق من صحة التوكن
          const testResponse = await authService.authenticatedRequest('/api/auth/user');
          
          // فقط تنظيف في حالة عدم تفويض واضح (401/403)
          if (testResponse.status === 401 || testResponse.status === 403) {
            console.log('❌ رد غير مفوض - مسح المصادقة التالفة');
            await this.clearAndForceReLogin('توكن غير صحيح - رد 401/403');
            return {
              success: false,
              message: 'تم اكتشاف توكن غير صحيح. يرجى تسجيل الدخول مرة أخرى.',
              needsLogin: true
            };
          }
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ التوكن صحيح للمستخدم:', testData.username);
            
            // إذا كان المستخدم مختلف عن المتوقع، قم بالمسح
            if (testData.username !== currentUser.username) {
              console.log('⚠️ تضارب في بيانات المستخدم - بدء المسح...');
              await this.clearAndForceReLogin('تضارب في بيانات المستخدم');
              return {
                success: false,
                message: 'تم اكتشاف تضارب في بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.',
                needsLogin: true
              };
            }
            
            return {
              success: true,
              message: 'المصادقة تعمل بشكل صحيح',
              needsLogin: false
            };
          } else {
            // خطأ في الشبكة أو خطأ مؤقت - لا تمسح المصادقة
            console.log('⚠️ خطأ مؤقت في التحقق من المصادقة - لا مسح');
            return {
              success: false,
              message: 'خطأ مؤقت في التحقق من المصادقة',
              needsLogin: false // لا نطلب إعادة تسجيل دخول
            };
          }
        } catch (error: unknown) {
          // خطأ في الشبكة - لا تمسح المصادقة
          console.log('ℹ️ خطأ شبكة في التحقق من المصادقة:', (error as any).message);
          return {
            success: false,
            message: 'خطأ شبكة مؤقت في التحقق من المصادقة',
            needsLogin: false // لا نطلب إعادة تسجيل دخول
          };
        }
      }
      
      // 3. لا يوجد توكن أو مستخدم - حالة عادية
      return {
        success: true,
        message: 'لا يوجد مصادقة مسبقة - حالة عادية',
        needsLogin: false
      };
      
    } catch (error: unknown) {
      console.log('ℹ️ خطأ عام في فحص المصادقة:', (error as any).message);
      
      // لا مسح قسري في حالة الفشل العام
      return {
        success: false,
        message: 'خطأ في فحص المصادقة',
        needsLogin: false
      };
    }
  }
  
  // مسح شامل وإجبار إعادة تسجيل الدخول
  static async clearAndForceReLogin(reason: string): Promise<void> {
    console.log(`🗑️ مسح شامل للمصادقة - السبب: ${reason}`);
    
    try {
      // 1. مسح جميع خدمات المصادقة الموجودة
      await authService.clearAuth();
      
      // 2. مسح شامل بالخدمة الجديدة
      await AuthClearingService.clearAllAuth({
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearCapacitorPreferences: true,
        force: true
      });
      
      console.log('✅ تم المسح الشامل بنجاح');
      
      // 3. إعادة تحميل AuthService لضمان المسح
      await authService.loadStoredAuth();
      
    } catch (error) {
      console.error('❌ فشل في المسح الشامل:', error);
      
      // مسح قسري في حالة الفشل
      try {
        await AuthClearingService.quickClearAll();
      } catch (finalError) {
        console.error('❌ فشل المسح القسري أيضاً:', finalError);
      }
    }
  }
  
  // تشخيص مشاكل المصادقة
  static async diagnoseAuthIssues(): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    console.log('🔍 تشخيص مشاكل المصادقة...');
    
    try {
      // 1. فحص التوكن الحالي
      const currentToken = authService.getToken();
      const currentUser = authService.getUser();
      
      if (!currentToken) {
        issues.push('لا يوجد توكن مصادقة');
        recommendations.push('يجب تسجيل الدخول');
      }
      
      if (!currentUser) {
        issues.push('لا توجد بيانات مستخدم');
        recommendations.push('يجب تسجيل الدخول لجلب بيانات المستخدم');
      }
      
      // 2. فحص التخزين المتبقي
      const remainingAuth = await AuthClearingService.checkRemainingAuth();
      
      if (remainingAuth.foundKeys.length > 0) {
        issues.push(`يوجد ${remainingAuth.foundKeys.length} مفاتيح مصادقة قديمة`);
        recommendations.push('يجب مسح البيانات القديمة');
        
        console.log('🔍 مفاتيح المصادقة المتبقية:', remainingAuth.foundKeys);
      }
      
      // 3. فحص تطابق البيانات
      if (currentToken && currentUser) {
        try {
          // محاولة فك تشفير التوكن (إذا كان JWT)
          if (currentToken.includes('.')) {
            const parts = currentToken.split('.');
            if (parts.length === 3) {
              try {
                const payload = JSON.parse(atob(parts[1]));
                if (payload.username && payload.username !== currentUser.username) {
                  issues.push(`تضارب في اسم المستخدم: التوكن للمستخدم ${payload.username} لكن البيانات للمستخدم ${currentUser.username}`);
                  recommendations.push('يجب مسح جميع البيانات وإعادة تسجيل الدخول');
                }
              } catch (error) {
                issues.push('فشل في فك تشفير التوكن');
                recommendations.push('التوكن قد يكون تالفاً - يجب إعادة تسجيل الدخول');
              }
            }
          }
        } catch (error) {
          console.log('ℹ️ لا يمكن فحص التوكن:', error);
        }
      }
      
      // 4. فحص البيئة
      const currentDomain = window.location.hostname;
      console.log('🌐 الدومين الحالي:', currentDomain);
      
      if (currentDomain.includes('replit.app') || currentDomain.includes('saidawifi.com')) {
        if (issues.length === 0) {
          issues.push('موقع منشور لكن قد توجد مشاكل خفية في المصادقة');
          recommendations.push('تجربة مسح المخزن والإعادة للتأكد');
        }
      }
      
      console.log('📋 نتائج التشخيص:');
      console.log('❌ المشاكل:', issues);
      console.log('💡 التوصيات:', recommendations);
      
      return { issues, recommendations };
      
    } catch (error) {
      console.error('❌ فشل التشخيص:', error);
      
      return {
        issues: ['فشل في تشخيص مشاكل المصادقة'],
        recommendations: ['يجب مسح البيانات وإعادة تسجيل الدخول']
      };
    }
  }
  
  // فحص ما إذا كان هذا موقع منشور
  static isProductionSite(): boolean {
    const currentDomain = window.location.hostname;
    
    // فحص الدوماينات المنشورة
    return currentDomain.endsWith('.replit.dev') || 
           currentDomain.endsWith('.replit.app') || 
           currentDomain.includes('saidawifi.com') ||
           currentDomain.includes('radius-manager');
  }
  
  // فحص ما إذا كان الإصلاح تم بالفعل في هذه الجلسة
  static hasFixRunThisSession(): boolean {
    return sessionStorage.getItem('authFixCompleted') === 'true';
  }
  
  // تسجيل أن الإصلاح تم
  static markFixCompleted(): void {
    sessionStorage.setItem('authFixCompleted', 'true');
  }
}

export default AuthFixService;