// تكوين API للاتصال المباشر مع سيرفر DMA Radius Manager
// ✅ محدث للعمل من سوريا بدون سيرفر وسيط
export const API_CONFIG = {
  // سيرفر DMA Radius Manager المباشر - يعمل من سوريا
  DMA_SERVER: "http://108.181.215.206",
  DMA_API_BASE: "http://108.181.215.206/radiusmanager/api",
  DMA_SCRIPTS_BASE: "http://108.181.215.206/dma",
  
  // للتطوير المحلي (إذا كان هناك سيرفر محلي)
  DEV_BASE_URL: "/api",
  
  // API مباشر مع DMA - بدون سيرفر وسيط أو Replit
  get BASE_URL() {
    // إذا كان في Capacitor (APK) - استخدام الاتصال المباشر
    if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") {
      console.log('🔧 APK detected - using direct DMA connection');
      return this.DMA_API_BASE;
    }
    
    // إذا كان في التطوير المحلي
    if (window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]") {
      return this.DEV_BASE_URL;
    }
    
    // في جميع الحالات الأخرى - استخدام الاتصال المباشر مع DMA
    console.log('🌐 Using direct DMA API connection - works from Syria');
    return this.DMA_API_BASE;
  },
  
  // للاتصال المباشر بسيرفر DMA
  get SERVER_URL() {
    return this.DMA_SERVER;
  }
};

// مسارات API المباشرة مع DMA Radius Manager - بدون سيرفر وسيط
export const DIRECT_API = {
  // API endpoints للاتصال المباشر مع DMA - يعمل من سوريا
  login: `${API_CONFIG.DMA_API_BASE}/login.php`,
  remaining: `${API_CONFIG.DMA_SCRIPTS_BASE}/get_remaining_detailedok.php`,
  userProfile: `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=get_user_info`,
  invoices: `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=get_invoices`,
  renewal: `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=renew_service`,
  
  // وظائف مساعدة لبناء URLs
  getUserInfo: (username: string) => `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=get_user_info&username=${encodeURIComponent(username)}`,
  getRemaining: (username: string) => `${API_CONFIG.DMA_SCRIPTS_BASE}/get_remaining_detailedok.php?username=${encodeURIComponent(username)}`,
  getInvoices: (username: string) => `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=get_invoices&username=${encodeURIComponent(username)}`,
  renewService: (username: string, srvid: string) => `${API_CONFIG.DMA_API_BASE}/sysapi.php?q=renew_service&username=${encodeURIComponent(username)}&srvid=${encodeURIComponent(srvid)}`
};