// Environment detection utility for Direct DMA API (works from Syria)
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
  
  // Check if we're on localhost (development only)
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
  // Check if we're in Replit development environment
  const isReplit = hostname.includes("replit") || hostname.includes("pike.replit.dev");
  
  // ✅ NEW: Use Direct API for all environments EXCEPT localhost
  // This allows the app to work from Syria by connecting directly to DMA server
  const shouldUseDirectAPI = !isLocalhost;
  
  // Determine environment type
  const isDevelopment = isReplit || isLocalhost;
  const isProduction = !isDevelopment;
  
  console.log('🌍 Environment Detection (Syria-compatible):', {
    hostname,
    protocol,
    isCapacitor,
    isReplit,
    isLocalhost,
    shouldUseDirectAPI: shouldUseDirectAPI ? '✅ Direct DMA (works from Syria)' : '🔧 Local development',
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