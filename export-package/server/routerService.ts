import fetch from 'node-fetch';

// إعدادات الراوتر الثابتة
const ROUTER_IP = "50.0.0.10";
const ROUTER_USER = "admin";
const ROUTER_PASS = "admin12345";

// إنشاء header التوثيق
const authHeader = "Basic " + Buffer.from(`${ROUTER_USER}:${ROUTER_PASS}`).toString('base64');

// واجهة بيانات الواي فاي
export interface WiFiSettings {
  ssid: string;
  password: string;
}

// واجهة بيانات الراوتر
export interface RouterInfo {
  wifiSettings: WiFiSettings;
  connectedDevices: number;
  routerIP: string;
  status: 'online' | 'offline';
}

/**
 * جلب إعدادات الواي فاي الحالية (اسم الشبكة وكلمة المرور)
 */
export async function getWifiSettings(): Promise<WiFiSettings> {
  try {
    const response = await fetch(`https://${ROUTER_IP}/userRpm/WlanNetworkRpm.htm`, {
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // استخراج اسم الشبكة من HTML
    const ssidMatch = html.match(/var ssid1 = "(.*?)";/);
    // استخراج كلمة مرور الواي فاي من HTML
    const passMatch = html.match(/var pskSecret = "(.*?)";/);

    return {
      ssid: ssidMatch ? ssidMatch[1] : "غير متوفر",
      password: passMatch ? passMatch[1] : "غير متوفر"
    };
  } catch (error) {
    console.error('Error fetching WiFi settings:', error);
    throw new Error('فشل في الاتصال بالراوتر أو جلب إعدادات الواي فاي');
  }
}

/**
 * جلب عدد الأجهزة المتصلة حالياً بالراوتر
 */
export async function getConnectedDevices(): Promise<number> {
  try {
    const response = await fetch(`https://${ROUTER_IP}/userRpm/DHCPTableRpm.htm`, {
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // البحث عن صفوف الأجهزة المتصلة في جدول DHCP
    const matches = html.match(/<tr>\s*<td class="tbl_num">/g);
    
    return matches ? matches.length : 0;
  } catch (error) {
    console.error('Error fetching connected devices:', error);
    throw new Error('فشل في جلب عدد الأجهزة المتصلة');
  }
}

/**
 * تغيير إعدادات الواي فاي (اسم الشبكة وكلمة المرور)
 */
export async function setWifiSettings(newSsid: string, newPassword: string): Promise<boolean> {
  try {
    // التحقق من صحة المدخلات
    if (!newSsid || !newPassword) {
      throw new Error('اسم الشبكة وكلمة المرور مطلوبان');
    }
    
    if (newSsid.length < 1 || newSsid.length > 32) {
      throw new Error('اسم الشبكة يجب أن يكون بين 1-32 حرف');
    }
    
    if (newPassword.length < 8 || newPassword.length > 63) {
      throw new Error('كلمة مرور الواي فاي يجب أن تكون بين 8-63 حرف');
    }
    
    // إنشاء رابط تحديث الإعدادات
    const url = `https://${ROUTER_IP}/userRpm/WlanNetworkRpm.htm?` +
      `ssid1=${encodeURIComponent(newSsid)}&` +
      `pskSecOpt=3&` +
      `pskSecret=${encodeURIComponent(newPassword)}&` +
      `Save=Save`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // التحقق من نجاح العملية
    console.log(`WiFi settings updated successfully: SSID="${newSsid}", Password length: ${newPassword.length}`);
    return true;
    
  } catch (error) {
    console.error('Error setting WiFi settings:', error);
    throw new Error('فشل في تحديث إعدادات الواي فاي');
  }
}

/**
 * جلب جميع معلومات الراوتر (دالة شاملة)
 */
export async function getRouterInfo(): Promise<RouterInfo> {
  try {
    // جلب المعلومات بشكل متوازي لتوفير الوقت
    const [wifiSettings, connectedDevices] = await Promise.all([
      getWifiSettings(),
      getConnectedDevices()
    ]);
    
    return {
      wifiSettings,
      connectedDevices,
      routerIP: ROUTER_IP,
      status: 'online'
    };
  } catch (error) {
    console.error('Error fetching router info:', error);
    
    // إرجاع بيانات افتراضية مع حالة غير متصل
    return {
      wifiSettings: { ssid: 'غير متوفر', password: 'غير متوفر' },
      connectedDevices: 0,
      routerIP: ROUTER_IP,
      status: 'offline'
    };
  }
}

/**
 * اختبار الاتصال بالراوتر
 */
export async function testRouterConnection(): Promise<boolean> {
  try {
    const response = await fetch(`https://${ROUTER_IP}/`, {
      headers: { 'Authorization': authHeader }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Router connection test failed:', error);
    return false;
  }
}