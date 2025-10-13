import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_CONFIG } from "../config/api";
import authService from "../services/authService";
import { detectEnvironment, isDirectAPIEnvironment } from "../lib/environmentDetector";
import directApiService from "../services/directApiService";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Hybrid API request function - uses Direct API or Node.js API based on environment
export async function apiRequest(
  method: string,
  url: string,      // مثال: "/api/renewal-request" or "/api/dashboard"
  data?: unknown,
): Promise<Response> {
  console.log(`🔄 Hybrid API Request: ${method} ${url}`);
  
  // Check environment to determine which API to use
  if (isDirectAPIEnvironment()) {
    console.log('🌐 Using Direct API Service');
    return await handleDirectAPIRequest(method, url, data);
  } else {
    console.log('🔧 Using Node.js API');
    return await handleNodeJSAPIRequest(method, url, data);
  }
}

// Handle Direct API requests (production environment)
async function handleDirectAPIRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  try {
    // Map API endpoints to Direct API service methods
    const endpointMap: { [key: string]: () => Promise<any> } = {
      '/api/dashboard': () => directApiService.getDashboardData(),
      '/api/auth/user': () => directApiService.getUserData(),
      '/api/remaining-detailed': () => directApiService.getRemainingData(),
      '/api/user-profile': () => directApiService.getUserData(),
      '/api/invoices': () => directApiService.getInvoices(),
    };
    
    // Handle renewal requests specially
    if (url === '/api/renewal-request' && method === 'POST') {
      const requestData = data as any;
      const srvid = requestData?.srvid;
      const result = await directApiService.renewSubscription(srvid);
      
      // Create a Response-like object
      const response = {
        ok: result.success,
        status: result.success ? 200 : 400,
        json: async () => result,
        text: async () => JSON.stringify(result)
      } as Response;
      
      if (!result.success) {
        throw new Error(`API Error: ${result.error}`);
      }
      
      return response;
    }
    
    // Handle other mapped endpoints
    if (endpointMap[url]) {
      const result = await endpointMap[url]();
      
      // Create a Response-like object
      const response = {
        ok: result.success,
        status: result.success ? 200 : 400,
        json: async () => result.success ? result.data || result : result,
        text: async () => JSON.stringify(result.success ? result.data || result : result)
      } as Response;
      
      if (!result.success) {
        throw new Error(`API Error: ${result.error}`);
      }
      
      return response;
    }
    
    // For unmapped endpoints, fall back to regular fetch
    console.warn(`⚠️ Unmapped Direct API endpoint: ${url}, falling back to fetch`);
    throw new Error(`Unmapped endpoint: ${url}`);
    
  } catch (error: any) {
    console.error(`❌ Direct API Request failed for ${url}:`, error.message);
    throw error;
  }
}

// Handle Node.js API requests (development environment)
async function handleNodeJSAPIRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // استخدام AuthService للحصول على التوكن من أي مصدر (Capacitor أو localStorage)
  await authService.loadStoredAuth();
  const token = authService.getToken();

  const headers: HeadersInit = {};

  // إضافة هيدر Authorization إذا كان التوكن موجوداً
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('🔑 queryClient apiRequest - Adding Authorization header');
  } else {
    console.log('⚠️ queryClient apiRequest - No token available');
  }

  // إعداد خيارات الطلب
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // إضافة Content-Type والجسم فقط للطرق التي تدعم ذلك (ليس GET أو HEAD)
  if (method !== "GET" && method !== "HEAD" && data) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(data);
  }

  // تحديد URL الكامل حسب البيئة - إصلاح المسار المكرر
  let fullUrl;
  if (url.startsWith("http")) {
    fullUrl = url;
  } else if (url.startsWith("/api") && API_CONFIG.BASE_URL === "/api") {
    // في التطوير: استخدم المسار كما هو
    fullUrl = url;
  } else if (url.startsWith("/api")) {
    // للإنتاج: استبدل /api بالمسار الكامل
    fullUrl = `${API_CONFIG.PROD_BASE_URL}${url.replace('/api', '')}`;
  } else {
    fullUrl = `${API_CONFIG.BASE_URL}${url}`;
  }
  
  console.log(`🌐 Node.js API Request: ${method} ${fullUrl}`);
  const res = await fetch(fullUrl, fetchOptions);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Hybrid query function - uses Direct API or Node.js API based on environment  
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`🔄 Hybrid Query Request: GET ${url}`);
    
    // Check environment to determine which API to use
    if (isDirectAPIEnvironment()) {
      console.log('🌐 Using Direct API Service for query');
      const result = await handleDirectAPIQuery<T>(url, unauthorizedBehavior);
      if (result === null && unauthorizedBehavior === "returnNull") {
        throw new Error("Unauthorized access");
      }
      return result as T;
    } else {
      console.log('🔧 Using Node.js API for query');
      const result = await handleNodeJSAPIQuery<T>(url, unauthorizedBehavior);
      if (result === null && unauthorizedBehavior === "returnNull") {
        throw new Error("Unauthorized access");
      }
      return result as T;
    }
  };
};

// Handle Direct API queries (production environment)
async function handleDirectAPIQuery<T>(
  url: string, 
  unauthorizedBehavior: UnauthorizedBehavior
): Promise<T | null> {
  try {
    // Map query endpoints to Direct API service methods
    const endpointMap: { [key: string]: () => Promise<any> } = {
      '/api/dashboard': () => directApiService.getDashboardData(),
      '/api/auth/user': () => directApiService.getUserData(),
      '/api/remaining-detailed': () => directApiService.getRemainingData(),
      '/api/user-profile': () => directApiService.getUserData(),
      '/api/invoices': () => directApiService.getInvoices(),
    };
    
    if (endpointMap[url]) {
      const result = await endpointMap[url]();
      
      if (!result.success) {
        if (unauthorizedBehavior === "returnNull" && result.error?.includes('401')) {
          return null;
        }
        throw new Error(`API Error: ${result.error}`);
      }
      
      return result.data || result;
    }
    
    // For unmapped endpoints, return empty result
    console.warn(`⚠️ Unmapped Direct API query: ${url}, returning null`);
    if (unauthorizedBehavior === "returnNull") {
      return null;
    }
    throw new Error(`Unmapped query endpoint: ${url}`);
    
  } catch (error: any) {
    console.error(`❌ Direct API Query failed for ${url}:`, error.message);
    if (unauthorizedBehavior === "returnNull") {
      return null;
    }
    throw error;
  }
}

// Handle Node.js API queries (development environment)
async function handleNodeJSAPIQuery<T>(
  url: string,
  unauthorizedBehavior: UnauthorizedBehavior
): Promise<T | null> {
  // استخدام AuthService للحصول على التوكن من أي مصدر (Capacitor أو localStorage)
  await authService.loadStoredAuth();
  const token = authService.getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('🔑 queryClient getQueryFn - Adding Authorization header for query');
  } else {
    console.log('⚠️ queryClient getQueryFn - No token available for query');
  }

  // تحديد URL الكامل حسب البيئة - إصلاح المسار المكرر
  let fullUrl;
  if (url.startsWith("http")) {
    fullUrl = url;
  } else if (url.startsWith("/api") && API_CONFIG.BASE_URL === "/api") {
    // في التطوير: استخدم المسار كما هو
    fullUrl = url;
  } else if (url.startsWith("/api")) {
    // للإنتاج: استبدل /api بالمسار الكامل
    fullUrl = `${API_CONFIG.PROD_BASE_URL}${url.replace('/api', '')}`;
  } else {
    fullUrl = `${API_CONFIG.BASE_URL}${url}`;
  }
  
  console.log(`🌐 Node.js Query Request: GET ${fullUrl}`);
  const res = await fetch(fullUrl, {
    headers,
  });

  if (unauthorizedBehavior === "returnNull" && res.status === 401) {
    return null;
  }

  await throwIfResNotOk(res);
  return await res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
