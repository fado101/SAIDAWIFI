// Direct API service للاتصال المباشر مع DMA Radius Manager من سوريا
import { DIRECT_API, API_CONFIG } from '../config/api';
import authService from './authService';
import CryptoJS from 'crypto-js';

interface DirectAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  ok?: boolean; // Some APIs use 'ok' instead of 'success'
  token?: string; // For login responses
  user?: any; // For login responses
}

interface UserData {
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  [key: string]: any;
}

interface RemainingData {
  username: string;
  service: string;
  package_gb: number;
  used_gb: number;
  remaining_gb: number;
  expiration: string;
}

interface InvoiceData {
  id: number;
  date: string;
  price: string;
  paid: string;
  paymode: number;
  service: string;
  managername?: string;
}

interface ServiceData {
  srvid: number;
  srvname: string;
  price: number;
  descr?: string;
  downrate?: number;
  uprate?: number;
}

class DirectApiService {
  
  // Helper function للاتصال المباشر مع DMA - يعمل من سوريا
  private async makeDirectRequest<T = any>(
    url: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: any
  ): Promise<DirectAPIResponse<T>> {
    try {
      console.log(`🌐 [Direct DMA] ${method}: ${url}`);
      
      const headers: Record<string, string> = {
        'User-Agent': 'DNA-Customer-Portal/1.0',
        'Accept': 'application/json, text/plain, */*'
      };
      
      const requestOptions: RequestInit = {
        method,
        headers,
        mode: 'cors',
      };
      
      // For POST requests, add form data
      if (method === 'POST' && data) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        requestOptions.body = formData;
        delete headers['Content-Type']; // Let browser set it for FormData
      }
      
      const response = await fetch(url, requestOptions);
      const text = await response.text();
      
      console.log(`📡 DMA Response (${response.status}):`, text.substring(0, 200));
      
      // Parse JSON response
      try {
        const json = JSON.parse(text);
        return {
          success: json.success ?? true,
          data: json.data ?? json,
          message: json.message,
          error: json.error
        };
      } catch (parseError) {
        // If not JSON, treat as success if response is OK
        return {
          success: response.ok,
          data: text as T,
          message: response.ok ? 'Success' : 'Request failed'
        };
      }
      
    } catch (error: any) {
      console.error(`❌ Direct DMA request failed for ${url}:`, error.message);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
  
  // تسجيل دخول مباشر مع DMA
  async login(username: string, password: string): Promise<DirectAPIResponse> {
    try {
      console.log(`🔐 Direct DMA login for user: ${username}`);
      
      // تشفير كلمة المرور بـ MD5 كما يتوقع DMA
      const hashedPassword = CryptoJS.MD5(password).toString();
      
      const response = await this.makeDirectRequest(
        DIRECT_API.login,
        'POST',
        {
          username,
          password: hashedPassword
        }
      );
      
      if (response.success) {
        console.log('✅ Direct DMA login successful');
        // Note: User data will be managed by the authentication flow
      }
      
      return response;
      
    } catch (error: any) {
      console.error('❌ Direct DMA login error:', error.message);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }
  
  // الحصول على بيانات المستخدم المحفوظة محلياً
  async getUserData(): Promise<DirectAPIResponse<UserData>> {
    try {
      const userData = authService.getUser();
      if (userData) {
        return {
          success: true,
          data: userData as UserData
        };
      }
      
      return {
        success: false,
        error: 'User data not found'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user data'
      };
    }
  }
  
  // الحصول على البيانات المتبقية مباشرة من DMA
  async getRemainingData(): Promise<DirectAPIResponse<RemainingData>> {
    try {
      const user = authService.getUser();
      if (!user?.username) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      const url = DIRECT_API.getRemaining(user.username);
      const response = await this.makeDirectRequest<RemainingData>(url);
      
      return response;
      
    } catch (error: any) {
      console.error('❌ Direct DMA remaining data error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get remaining data'
      };
    }
  }
  
  // الحصول على الفواتير مباشرة من DMA
  async getInvoices(): Promise<DirectAPIResponse<InvoiceData[]>> {
    try {
      const user = authService.getUser();
      if (!user?.username) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      const url = DIRECT_API.getInvoices(user.username);
      const response = await this.makeDirectRequest<InvoiceData[]>(url);
      
      return response;
      
    } catch (error: any) {
      console.error('❌ Direct DMA invoices error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get invoices'
      };
    }
  }
  
  // تجديد الاشتراك مباشرة مع DMA
  async renewSubscription(srvid: string): Promise<DirectAPIResponse> {
    try {
      const user = authService.getUser();
      if (!user?.username) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      const url = DIRECT_API.renewService(user.username, srvid);
      const response = await this.makeDirectRequest(url, 'POST');
      
      return response;
      
    } catch (error: any) {
      console.error('❌ Direct DMA renewal error:', error.message);
      return {
        success: false,
        error: error.message || 'Renewal failed'
      };
    }
  }
  
  // الحصول على بيانات Dashboard كاملة
  async getDashboardData(): Promise<DirectAPIResponse> {
    try {
      // جمع البيانات من مصادر متعددة
      const [userData, remainingData, invoicesData] = await Promise.all([
        this.getUserData(),
        this.getRemainingData(),
        this.getInvoices()
      ]);
      
      if (!userData.success) {
        return userData;
      }
      
      // تجميع البيانات
      const dashboardData = {
        user: userData.data,
        service: remainingData.data || {},
        invoices: invoicesData.data || [],
        stats: {
          dailyUsage: 0,
          sessionTime: 0,
          signalStrength: "ممتاز",
          currentSpeed: "4 Mbps",
          connectionStatus: "متصل"
        }
      };
      
      return {
        success: true,
        data: dashboardData
      };
      
    } catch (error: any) {
      console.error('❌ Direct DMA dashboard error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get dashboard data'
      };
    }
  }
}

const directApiService = new DirectApiService();
export default directApiService;