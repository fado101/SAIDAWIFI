// Enhanced Logout Service
import { JWTAuthService } from './jwtAuth';
import { queryClient } from '@/lib/queryClient';

export async function performEnhancedLogout(): Promise<void> {
  try {
    console.log('🚪 Performing enhanced logout...');
    
    // Clear JWT authentication
    await JWTAuthService.clearAuth();
    
    
    // Clear React Query cache
    queryClient.clear();
    queryClient.invalidateQueries();
    
    // Force clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies if available
    if (document.cookie) {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    }
    
    console.log('✅ Enhanced logout completed');
  } catch (error) {
    console.error('❌ Enhanced logout failed:', error);
    // Force clear even if there's an error
    localStorage.clear();
    sessionStorage.clear();
  }
}