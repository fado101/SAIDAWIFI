// JWT Authentication Service for Web App
// Handles token-based authentication with localStorage

export interface JWTAuthData {
  token: string;
  username: string;
  userData: any;
  expiresAt: number;
}

export class JWTAuthService {
  private static readonly JWT_KEY = 'jwt_auth_token';
  private static readonly USER_DATA_KEY = 'jwt_user_data';
  private static readonly TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Generate JWT token for web authentication
  static generateToken(username: string, userData: any): string {
    const payload = {
      username,
      userData,
      iat: Date.now(),
      exp: Date.now() + this.TOKEN_EXPIRY
    };
    
    // Simple JWT-like token for web storage
    return btoa(JSON.stringify(payload));
  }

  // Save JWT authentication data
  static async saveAuth(authData: JWTAuthData): Promise<void> {
    try {
      console.log('🔐 Saving JWT authentication data');
      
      // Use localStorage for web
      localStorage.setItem(this.JWT_KEY, authData.token);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify({
        username: authData.username,
        userData: authData.userData,
        expiresAt: authData.expiresAt
      }));
      
      console.log('✅ JWT authentication saved successfully');
    } catch (error) {
      console.error('❌ Failed to save JWT auth:', error);
    }
  }

  // Load JWT authentication data
  static async loadAuth(): Promise<JWTAuthData | null> {
    try {
      console.log('🔍 Loading JWT authentication data');
      
      const token = localStorage.getItem(this.JWT_KEY);
      const userDataStr = localStorage.getItem(this.USER_DATA_KEY);
      
      if (!token || !userDataStr) {
        console.log('🔍 No JWT auth data found');
        return null;
      }
      
      const userData = JSON.parse(userDataStr);
      
      // Check if token is expired
      if (userData.expiresAt && userData.expiresAt < Date.now()) {
        console.log('⏰ JWT token expired, clearing auth');
        await this.clearAuth();
        return null;
      }
      
      console.log('✅ JWT authentication loaded successfully');
      return {
        token,
        username: userData.username,
        userData: userData.userData,
        expiresAt: userData.expiresAt
      };
    } catch (error) {
      console.error('❌ Failed to load JWT auth:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const authData = await this.loadAuth();
    return authData !== null;
  }

  // Get current user data
  static async getCurrentUser(): Promise<any> {
    const authData = await this.loadAuth();
    return authData ? authData.userData : null;
  }

  // Clear JWT authentication
  static async clearAuth(): Promise<void> {
    try {
      console.log('🚪 Clearing JWT authentication');
      
      localStorage.removeItem(this.JWT_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      
      console.log('✅ JWT authentication cleared');
    } catch (error) {
      console.error('❌ Failed to clear JWT auth:', error);
    }
  }

  // Create and save new auth session
  static async createAuthSession(username: string, userData: any): Promise<JWTAuthData> {
    const token = this.generateToken(username, userData);
    const authData: JWTAuthData = {
      token,
      username,
      userData,
      expiresAt: Date.now() + this.TOKEN_EXPIRY
    };
    
    await this.saveAuth(authData);
    return authData;
  }

  // Refresh token (extend expiry)
  static async refreshToken(): Promise<boolean> {
    try {
      const authData = await this.loadAuth();
      if (!authData) return false;
      
      // Create new token with extended expiry
      const newToken = this.generateToken(authData.username, authData.userData);
      const newAuthData: JWTAuthData = {
        ...authData,
        token: newToken,
        expiresAt: Date.now() + this.TOKEN_EXPIRY
      };
      
      await this.saveAuth(newAuthData);
      console.log('🔄 JWT token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh JWT token:', error);
      return false;
    }
  }
}