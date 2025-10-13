import { useQuery } from "@tanstack/react-query";
import authService from "@/services/authService";
import { isDirectAPIEnvironment } from "@/lib/environmentDetector";
import directApiService from "@/services/directApiService";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    refetchInterval: false,
    queryFn: async () => {
      console.log('🔐 Hybrid Auth Check - Environment:', isDirectAPIEnvironment() ? 'Direct API' : 'Node.js API');
      
      // انتظار إضافي للتأكد من تحميل Token
      await authService.loadStoredAuth();
      
      // التحقق من وجود JWT Token
      if (!authService.isAuthenticated()) {
        console.log('❌ No JWT token found');
        return null;
      }
      
      console.log('🔑 JWT token found, validating...');
      
      try {
        if (isDirectAPIEnvironment()) {
          // استخدام Direct API في بيئة الإنتاج
          console.log('🌐 Using Direct API for auth validation');
          const response = await directApiService.getUserData();
          
          if (response.success && response.data) {
            const userData = response.data;
            console.log('✅ Valid Direct API authentication found:', userData.username);
            return {
              isAuthenticated: true,
              username: userData.username,
              email: userData.email || userData.username,
              firstName: userData.firstname || userData.username,
              lastName: userData.lastname || ''
            };
          } else {
            console.log('❌ Direct API auth validation failed:', response.error);
            return null;
          }
        } else {
          // استخدام Node.js API في بيئة التطوير
          console.log('🔧 Using Node.js API for auth validation');
          const response = await authService.get('/api/auth/user');
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Valid Node.js API authentication found:', userData.username);
            return {
              isAuthenticated: true,
              ...userData
            };
          } else {
            const errorText = await response.text();
            console.log('❌ Node.js API auth validation failed. Status:', response.status, 'Error:', errorText);
            return null;
          }
        }
      } catch (error) {
        console.error('❌ Error validating authentication:', error);
        return null;
      }
    },
  });

  const isAuthenticated = !!user?.isAuthenticated || !!user?.username;
  console.log('🔐 Hybrid Auth status - user:', user, 'isAuthenticated:', isAuthenticated, 'environment:', isDirectAPIEnvironment() ? 'Direct API' : 'Node.js API');

  return {
    user,
    isLoading,
    isAuthenticated,
    error: error && (error as any).message !== "401: Unauthorized" ? error : null,
    refetch
  };
}
