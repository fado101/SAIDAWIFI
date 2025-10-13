// تكوين API للتطبيق - محسن للـ APK
export const API_CONFIG = {
  // خادم الإنتاج الرئيسي
  PROD_SERVER: "https://saidawifi.com",
  
  // للتطوير المحلي
  DEV_BASE_URL: "/api",
  
  // للإنتاج - السيرفر الخاص (يجب استخدام HTTPS مع دومين صحيح)
  PROD_BASE_URL: "https://saidawifi.com/api",
  
  // اكتشاف البيئة الذكي
  get BASE_URL() {
    // إذا كان في Capacitor (APK)
    if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") {
      console.log('🔧 APK detected - using production server');
      return this.PROD_BASE_URL;
    }
    
    // إذا كان في Replit web
    if (window.location.hostname.includes("replit")) {
      return this.DEV_BASE_URL;
    }
    
    // إذا كان على السيرفر الخاص أو الدومين المخصص
    if (window.location.hostname === "108.181.215.206" || 
        window.location.hostname === "104.248.210.61" || 
        window.location.hostname === "saidawifi.com" ||
        window.location.hostname === "www.saidawifi.com" ||
        window.location.hostname.endsWith(".saidawifi.com")) {
      return "/api";
    }
    
    // إذا كان في التطوير المحلي (localhost أو 127.0.0.1)
    if (window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]") {
      return this.DEV_BASE_URL;
    }
    
    // إذا كان في متصفح خارجي
    console.log('🌐 External browser - using production server');
    return this.PROD_BASE_URL;
    
  },
  
  // للاتصال المباشر بالخادم في APK
  get SERVER_URL() {
    if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") {
      return this.PROD_SERVER;
    }
    return "";
  }
};

// وظائف API مخصصة للتطبيق المحمول - مسارات محمية وآمنة
export const DIRECT_API = {
  // استخدام مسارات آمنة محمية بالمصادقة
  login: "/api/login",
  userdata: "/api/user-profile", 
  remaining: "/api/proxy/remaining",
  invoices: "/api/proxy/invoices",
  renewal: "/api/proxy/renew",
};