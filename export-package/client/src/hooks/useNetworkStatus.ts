import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  connectionStrength: 'excellent' | 'good' | 'poor' | 'offline';
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastConnected: navigator.onLine ? new Date() : null,
    connectionStrength: navigator.onLine ? 'excellent' : 'offline'
  });

  useEffect(() => {
    let connectingTimeout: NodeJS.Timeout;
    let strengthCheckInterval: NodeJS.Timeout;

    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastConnected: new Date(),
        connectionStrength: 'excellent'
      }));

      // Start checking connection strength
      strengthCheckInterval = setInterval(checkConnectionStrength, 5000);
    };

    const handleOffline = () => {
      clearInterval(strengthCheckInterval);
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: true,
        connectionStrength: 'offline'
      }));

      // Show connecting state for a brief moment
      connectingTimeout = setTimeout(() => {
        setNetworkStatus(prev => ({
          ...prev,
          isConnecting: false
        }));
      }, 2000);
    };

    const checkConnectionStrength = async () => {
      if (!navigator.onLine) return;

      const startTime = Date.now();
      try {
        // Test connection by making a small request to our server
        await fetch('/api/auth/user', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const responseTime = Date.now() - startTime;
        let strength: NetworkStatus['connectionStrength'] = 'excellent';
        
        if (responseTime > 2000) strength = 'poor';
        else if (responseTime > 1000) strength = 'good';
        
        setNetworkStatus(prev => ({
          ...prev,
          connectionStrength: strength
        }));
      } catch (error) {
        setNetworkStatus(prev => ({
          ...prev,
          connectionStrength: 'poor'
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial strength check if online
    if (navigator.onLine) {
      checkConnectionStrength();
      strengthCheckInterval = setInterval(checkConnectionStrength, 5000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(connectingTimeout);
      clearInterval(strengthCheckInterval);
    };
  }, []);

  return networkStatus;
}