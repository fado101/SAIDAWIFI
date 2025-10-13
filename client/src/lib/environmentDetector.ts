// Environment detection utility for hybrid API system
export interface Environment {
  isDevelopment: boolean;
  isProduction: boolean;
  isCapacitor: boolean;
  shouldUseDirectAPI: boolean;
  baseURL: string;
  apiType: 'nodejs' | 'direct';
}

export function detectEnvironment(): Environment {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Check if running in Capacitor (mobile app)
  const isCapacitor = protocol === "capacitor:" || protocol === "file:";
  
  // Check if we're on production domain
  const isProductionDomain = hostname === "saidawifi.com" || 
                            hostname === "www.saidawifi.com" ||
                            hostname.endsWith(".saidawifi.com") ||
                            hostname === "108.181.215.206" || 
                            hostname === "104.248.210.61";
  
  // Check if we're in Replit development environment
  const isReplit = hostname.includes("replit") || hostname.includes("pike.replit.dev");
  
  // Check if we're on localhost
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
  // ✅ CRITICAL FIX: تعطيل Direct API مؤقتاً لحل مشكلة النشر
  // TODO: سيتم إعادة تفعيله لاحقاً للموبايل فقط  
  const shouldUseDirectAPI = false; // isCapacitor;
  
  // Determine environment type
  const isDevelopment = isReplit || isLocalhost;
  const isProduction = isProductionDomain || isCapacitor;
  
  console.log('🌍 Environment Detection:', {
    hostname,
    protocol,
    isCapacitor,
    isProductionDomain,
    isReplit,
    isLocalhost,
    shouldUseDirectAPI,
    isDevelopment,
    isProduction
  });
  
  return {
    isDevelopment,
    isProduction,
    isCapacitor,
    shouldUseDirectAPI,
    baseURL: shouldUseDirectAPI ? '' : '/api', // Direct API uses full URLs, Node.js uses /api
    apiType: shouldUseDirectAPI ? 'direct' : 'nodejs'
  };
}

// Global environment instance
export const environment = detectEnvironment();

// Helper functions
export function isDirectAPIEnvironment(): boolean {
  return environment.shouldUseDirectAPI;
}

export function isNodeJSEnvironment(): boolean {
  return !environment.shouldUseDirectAPI;
}

export function getAPIBaseURL(): string {
  return environment.baseURL;
}

export function getAPIType(): 'nodejs' | 'direct' {
  return environment.apiType;
}