// Direct API service for production environment (saidawifi.com) - SECURE VERSION
import { DIRECT_API } from '../config/api';
import authService from './authService';
import { detectEnvironment } from '../lib/environmentDetector';

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
  
  // SECURE Helper function to make authenticated requests to Direct API
  private async makeRequest<T = any>(
    url: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: any,
    includeAuth: boolean = true
  ): Promise<DirectAPIResponse<T>> {
    try {
      console.log(`🌐 [SECURE] Direct API ${method}: ${url}`);
      
      const headers: Record<string, string> = {
        'Content-Type': method === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json',
      };
      
      // 🔐 SECURITY: Add Authorization header for authenticated requests
      if (includeAuth) {
        const token = authService.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔑 [SECURE] Added Authorization header to Direct API request');
        } else {
          console.warn('⚠️ [SECURITY WARNING] No token available for authenticated request');
          return {
            success: false,
            error: 'No authentication token available - please login'
          };
        }
      }
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include', // Include cookies for additional security
      };
      
      if (method === 'POST' && data) {
        // Convert data to URL-encoded format for PHP APIs
        const formData = new URLSearchParams();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        options.body = formData.toString();
      }
      
      const response = await fetch(url, options);
      
      // 🔐 SECURITY: Handle authentication failures properly
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('🚨 [SECURITY ALERT] Authentication failed - token invalid/expired');
          await authService.clearAuth(); // Clear invalid token
          return {
            success: false,
            error: 'Authentication failed - please login again'
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const textData = await response.text();
      console.log(`📥 [SECURE] Direct API Response Length: ${textData.length} chars`);
      
      if (!textData || !textData.trim()) {
        throw new Error('Empty response from server');
      }
      
      let result;
      try {
        result = JSON.parse(textData);
      } catch (parseError) {
        console.error('❌ Failed to parse server response as JSON:', textData.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }
      
      console.log(`✅ [SECURE] Direct API Success:`, result.success || result.ok ? 'OK' : 'Failed');
      
      // 🔐 SECURITY: Validate server response structure
      if (includeAuth && (result.success === false || result.ok === false)) {
        if (result.error === 'Invalid token' || result.error === 'Token expired') {
          console.error('🚨 [SECURITY ALERT] Server rejected JWT token');
          await authService.clearAuth();
          return {
            success: false,
            error: 'Authentication failed - please login again'
          };
        }
      }
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ [SECURE] Direct API Error for ${url}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to connect to API'
      };
    }
  }
  
  // 🔐 SECURITY: Validate authentication - no longer rely on username alone
  private isAuthenticated(): boolean {
    return authService.isAuthenticated();
  }
  
  // Get authenticated username from authService (for logging/display only - NOT for authentication)
  private getUsername(): string | null {
    const user = authService.getUser();
    return user?.username || null;
  }
  
  // 🔐 SECURE LOGIN: Get REAL JWT token from PHP server
  async login(username: string, password: string): Promise<DirectAPIResponse<{ token: string, user: UserData }>> {
    try {
      console.log('🔐 [SECURE] Attempting secure login to PHP server...');
      
      // Make request WITHOUT authentication (this is login)
      const response = await this.makeRequest(DIRECT_API.login, 'POST', {
        username,
        password
      }, false); // includeAuth = false for login
      
      if (response.success || response.ok) {
        // 🔐 SECURITY: PHP server MUST return a REAL JWT token
        const serverToken = response.token || response.data?.token;
        
        if (!serverToken) {
          console.error('🚨 [SECURITY ALERT] PHP server did not return JWT token!');
          return {
            success: false,
            error: 'Server authentication error - no token provided'
          };
        }
        
        // 🔐 SECURITY: Validate token format (basic check)
        if (typeof serverToken !== 'string' || serverToken.length < 20) {
          console.error('🚨 [SECURITY ALERT] PHP server returned invalid token format!');
          return {
            success: false,
            error: 'Server authentication error - invalid token format'
          };
        }
        
        console.log('✅ [SECURE] Received REAL JWT token from PHP server');
        
        // Extract user data from server response or use provided data
        const userData = response.data || response.user || {};
        const user: UserData = {
          username: userData.username || username,
          email: userData.email || username,
          firstname: userData.firstname || userData.firstName || username,
          lastname: userData.lastname || userData.lastName || '',
        };
        
        console.log('👤 [SECURE] User data from server:', user.username);
        
        return {
          success: true,
          data: { token: serverToken, user },
          message: response.message || 'تم تسجيل الدخول بنجاح'
        };
      } else {
        console.error('❌ [SECURE] PHP server login failed:', response.message || response.error);
        return {
          success: false,
          error: response.message || response.error || 'اسم المستخدم أو كلمة المرور غير صحيحة'
        };
      }
    } catch (error: any) {
      console.error('❌ [SECURE] Login error:', error);
      return {
        success: false,
        error: error.message || 'خطأ في الاتصال بالخادم'
      };
    }
  }
  
  // 🔐 SECURE: Get user profile data - secured with JWT
  async getUserData(): Promise<DirectAPIResponse<UserData>> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated - please login' };
    }
    
    try {
      console.log('🔐 [SECURE] Getting user data with JWT authentication');
      
      // 🔐 SECURITY: Use JWT authentication instead of username in query
      const response = await this.makeRequest<UserData>(DIRECT_API.userdata);
      
      if (response.success && response.data) {
        console.log('✅ [SECURE] User data retrieved successfully');
        return response;
      } else if (response.error === 'Authentication failed - please login again') {
        // Token is invalid/expired
        return response;
      } else {
        console.warn('⚠️ [SECURE] User data API returned no data, using fallback');
        // Fallback: return basic user data from stored auth
        const user = authService.getUser();
        return {
          success: true,
          data: {
            username: user?.username || 'Unknown',
            firstname: user?.firstName || 'Unknown',
            lastname: user?.lastName || '',
            email: user?.email || 'Unknown'
          }
        };
      }
    } catch (error: any) {
      console.error('❌ [SECURE] Error getting user data:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user data'
      };
    }
  }
  
  // 🔐 SECURE: Get remaining data (detailed usage) - secured with JWT
  async getRemainingData(): Promise<DirectAPIResponse<RemainingData>> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated - please login' };
    }
    
    console.log('🔐 [SECURE] Getting remaining data with JWT authentication');
    
    // 🔐 SECURITY: Use JWT authentication instead of username in query
    return this.makeRequest<RemainingData>(DIRECT_API.remaining);
  }
  
  // 🔐 SECURE: Get invoices data - secured with JWT
  async getInvoices(): Promise<DirectAPIResponse<InvoiceData[]>> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated - please login' };
    }
    
    console.log('🔐 [SECURE] Getting invoices with JWT authentication');
    
    // 🔐 SECURITY: Use JWT authentication instead of username in query
    return this.makeRequest<InvoiceData[]>(DIRECT_API.invoices);
  }
  
  // 🔐 SECURE: Renew subscription - secured with JWT
  async renewSubscription(srvid?: number): Promise<DirectAPIResponse<any>> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated - please login' };
    }
    
    console.log('🔐 [SECURE] Renewing subscription with JWT authentication');
    
    const payload: any = {};
    if (srvid) {
      payload.srvid = srvid;
    }
    
    // 🔐 SECURITY: JWT authentication handled in makeRequest - no username in payload
    return this.makeRequest(DIRECT_API.renewal, 'POST', payload);
  }
  
  // 🔐 SECURE: Build comprehensive dashboard data from multiple Direct API calls - secured with JWT
  async getDashboardData(): Promise<DirectAPIResponse<any>> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated - please login' };
    }
    
    try {
      console.log('🔐 [SECURE] Building dashboard data from Direct APIs with JWT authentication...');
      
      // Make parallel requests to all required APIs
      const [userResponse, remainingResponse, invoicesResponse] = await Promise.all([
        this.getUserData(),
        this.getRemainingData(),
        this.getInvoices()
      ]);
      
      console.log('📊 [SECURE] Direct API Responses:', {
        user: userResponse.success,
        remaining: remainingResponse.success,
        invoices: invoicesResponse.success
      });
      
      // 🔐 SECURITY: Check for authentication errors
      const authErrors = [
        userResponse.error === 'Authentication failed - please login again',
        remainingResponse.error === 'Authentication failed - please login again',
        invoicesResponse.error === 'Authentication failed - please login again'
      ];
      
      if (authErrors.some(Boolean)) {
        console.error('🚨 [SECURITY ALERT] Authentication failed in dashboard API calls');
        return {
          success: false,
          error: 'Authentication failed - please login again'
        };
      }
      
      const username = this.getUsername() || 'Unknown';
      
      // Build dashboard data structure
      const dashboardData: any = {
        user: {
          firstName: userResponse.data?.firstname || username,
          email: userResponse.data?.email || username
        },
        service: null,
        stats: {
          dailyUsage: 0,
          sessionTime: 0,
          signalStrength: 'جيد',
          currentSpeed: '0 Mbps',
          connectionStatus: 'متصل'
        },
        invoices: invoicesResponse.data || [],
        unpaidInvoices: [],
        hasUnpaidInvoice: false
      };
      
      // Process remaining data if available
      if (remainingResponse.success && remainingResponse.data) {
        const remaining = remainingResponse.data;
        const expiryDate = new Date(remaining.expiration);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        dashboardData.service = {
          name: remaining.service,
          remainingData: remaining.remaining_gb,
          totalData: remaining.package_gb,
          expiryDate: remaining.expiration,
          daysRemaining: Math.max(0, daysRemaining),
          activationDate: remaining.expiration, // Fallback
          isExpired: remaining.remaining_gb <= 0 || expiryDate.getTime() < now.getTime()
        };
        
        // Extract speed from service name
        const speedMatch = remaining.service.match(/(\d+)M/);
        if (speedMatch) {
          dashboardData.serviceName = remaining.service;
          dashboardData.speedMbps = `${speedMatch[1]} Mbps`;
          dashboardData.stats.currentSpeed = `${speedMatch[1]} Mbps`;
        }
      }
      
      // Process invoices data
      if (invoicesResponse.success && invoicesResponse.data) {
        const invoices = invoicesResponse.data;
        
        // Find unpaid invoices (paymode = 1 means unpaid)
        const unpaidInvoices = invoices.filter((invoice: InvoiceData) => 
          invoice.paymode === 1 || invoice.paymode === 0
        ).map((invoice: InvoiceData) => ({
          id: invoice.id,
          amount: parseFloat(invoice.price) || 0,
          dueDate: invoice.date,
          description: invoice.service,
          paymode: invoice.paymode,
          service: invoice.service
        }));
        
        dashboardData.unpaidInvoices = unpaidInvoices;
        dashboardData.hasUnpaidInvoice = unpaidInvoices.length > 0;
        
        console.log(`📊 [SECURE] Found ${unpaidInvoices.length} unpaid invoices`);
      }
      
      console.log('✅ [SECURE] Dashboard data built successfully');
      return {
        success: true,
        data: dashboardData
      };
      
    } catch (error: any) {
      console.error('❌ [SECURE] Error building dashboard data:', error);
      return {
        success: false,
        error: error.message || 'Failed to build dashboard data'
      };
    }
  }
}

export const directApiService = new DirectApiService();
export default directApiService;