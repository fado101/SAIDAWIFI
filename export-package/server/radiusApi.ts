import fetch from 'node-fetch';
import { validateUserCredentials } from './db';

const RADIUS_API_BASE = 'https://108.181.215.206/radiusmanager/api';

export interface RadiusUserData {
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  expiration?: string;
  credits?: string;
  enableuser?: string;
  srvid?: string;
}

export interface RadiusLoginResult {
  success: boolean;
  message?: string;
}

export class RadiusApiService {
  async login(credentials: { username: string; password: string }): Promise<RadiusLoginResult> {
    try {
      const { username, password } = credentials;
      
      console.log(`🔐 Attempting secure login for user: ${username}`);
      
      // استخدام API DMA للتحقق من صحة كلمة المرور
      console.log(`🔐 Validating credentials using DMA API`);
      
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const https = await import('https');
      const httpsAgent = new https.Agent({
        // تفعيل التحقق من الشهادة للأمان
        rejectUnauthorized: true
      });
      
      const loginResponse = await fetch(`${RADIUS_API_BASE}/login.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'DNA-Customer-Portal/1.0'
        },
        agent: httpsAgent
      });

      const loginText = await loginResponse.text();
      console.log(`🔐 DMA Login Response: ${loginText.substring(0, 200)}`);
      
      // 🔐 CRITICAL FIX: Parse JSON response properly
      let loginResult;
      try {
        loginResult = JSON.parse(loginText);
        console.log(`🔐 Parsed JSON Result:`, loginResult);
        
        // تحقق من الاستجابة JSON
        if (loginResult.success === false) {
          console.log(`❌ DMA Authentication failed for user: ${username} - ${loginResult.message}`);
          return {
            success: false,
            message: loginResult.message || 'اسم المستخدم أو كلمة المرور غير صحيحة'
          };
        }
        
        // إذا كانت success = true، فتسجيل الدخول ناجح
        if (loginResult.success === true) {
          console.log(`✅ DMA authentication successful for user: ${username}`);
        }
        
      } catch (jsonError) {
        // إذا لم يكن JSON، فحص النص التقليدي
        console.log(`⚠️ Response is not JSON, checking text patterns`);
        
        if (loginText.includes('error') || loginText.includes('invalid') || loginText.includes('failed')) {
          console.log(`❌ DMA Authentication failed for user: ${username} - Text indicates failure`);
          return {
            success: false,
            message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
          };
        }
      }

      console.log(`✅ DMA authentication successful for user: ${username}`);
      
      // Additional verification: check if user has valid service data
      try {
        const verifyResponse = await fetch(`${RADIUS_API_BASE}/sysapi.php?q=get_remaining&username=${encodeURIComponent(username)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DNA-Customer-Portal/1.0'
          }
        });

        if (verifyResponse.ok) {
          const verifyText = await verifyResponse.text();
          try {
            const verifyData = JSON.parse(verifyText);
            if (Array.isArray(verifyData) && verifyData.length >= 2 && verifyData[1]) {
              console.log('✅ User service data verification successful');
            } else {
              console.log('⚠️ User service data not found, but authentication was successful');
            }
          } catch (e) {
            console.log('⚠️ Service data verification failed, but authentication was successful');
          }
        }
      } catch (verifyError) {
        console.log('⚠️ Service verification error, but authentication was successful:', verifyError);
      }
      
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح'
      };
    } catch (error) {
      console.error('❌ Error during secure login:', error);
      return {
        success: false,
        message: 'خطأ في الاتصال بالخادم'
      };
    }
  }

  async getUserData(username: string): Promise<RadiusUserData> {
    try {
      // 🔧 استخدام API الموحد sysapi.php
      const https = await import('https');
      const httpsAgent = new https.Agent({
        // تفعيل التحقق من الشهادة للأمان
        rejectUnauthorized: true
      });
      
      const response = await fetch(`${RADIUS_API_BASE}/sysapi.php?q=get_userdata&username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DNA-Customer-Portal/1.0'
        },
        agent: httpsAgent
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Get userdata API raw response:', responseText);

      try {
        const apiResponse = JSON.parse(responseText);
        
        if (!apiResponse.success) {
          throw new Error('API returned error response');
        }

        const userData = apiResponse.data || {};
        return {
          username: userData.username || username,
          firstname: userData.firstname || username,
          lastname: userData.lastname || '',
          email: userData.email || username,
          expiration: userData.expiration || '',  // 🔧 استخدام expiration مباشرة من userData
          credits: userData.credits || '',
          enableuser: userData.enableuser || '',
          srvid: userData.srvid || ''
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was not valid JSON:', responseText);
        return {
          username,
          firstname: username,
          lastname: '',
          email: username,
          expiration: '',
          credits: '',
          enableuser: '',
          srvid: ''
        };
      }
    } catch (error) {
      console.error('Error fetching user data from Radius API:', error);

      return {
        username,
        firstname: username,
        lastname: '',
        email: username,
        expiration: '',
        credits: '',
        enableuser: '',
        srvid: ''
      };
    }
  }

  async getRemaining(username: string): Promise<any> {
    try {
      // استخدام API الجديد للحصول على البيانات المفصلة والدقيقة
      // استخدام نفس configuration كـ proxy route لضمان الاتساق
      const https = await import('https');
      const httpsAgent = new https.Agent({
        // تفعيل التحقق من الشهادة للأمان
        rejectUnauthorized: true
      });
      
      const response = await fetch(`https://108.181.215.206/radiusmanager/api/get_remaining_detailedok.php?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DNA-Radius-Manager/1.0)',
        },
        agent: httpsAgent
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Get remaining detailed API raw response:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        return null;
      }

      try {
        const apiResponse = JSON.parse(responseText);
        
        if (!apiResponse.success) {
          throw new Error('API returned error response');
        }

        // إرجاع البيانات المفصلة مع الحقول الجديدة
        return apiResponse.data || null;
      } catch (parseError) {
        console.error('JSON parse error in getRemaining for user:', username);
        console.error('Parse error:', parseError);
        console.error('Raw response preview:', responseText.substring(0, 200));
        return null;
      }
    } catch (error) {
      console.error('Error fetching remaining data from Radius API:', error);
      return null;
    }
  }

  async getRemainingDetailed(username: string): Promise<any> {
    try {
      const https = await import('https');
      const httpsAgent = new https.Agent({
        // تفعيل التحقق من الشهادة للأمان
        rejectUnauthorized: true
      });
      
      const response = await fetch(`${RADIUS_API_BASE}/sysapi.php?q=get_remaining_detailed&username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DNA-Customer-Portal/1.0'
        },
        agent: httpsAgent
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        return null;
      }

      try {
        // تحقق من أن الاستجابة JSON وليس HTML
        if (responseText.trim().startsWith('<')) {
          console.error('API returned HTML instead of JSON for user:', username);
          console.error('Response preview:', responseText.substring(0, 100));
          return null;
        }
        
        const apiResponse = JSON.parse(responseText);
        
        // sysapi.php returns [0, {data}] format
        if (Array.isArray(apiResponse) && apiResponse.length >= 2 && apiResponse[1]) {
          return apiResponse[1];
        }
        
        return null;
      } catch (parseError) {
        console.error('JSON parse error in getRemainingDetailed for user:', username);
        console.error('Parse error:', parseError);
        console.error('Raw response preview:', responseText.substring(0, 200));
        return null;
      }
    } catch (error) {
      console.error('Error fetching remaining data from Radius API:', error);
      return null;
    }
  }
}

export const radiusApi = new RadiusApiService();
