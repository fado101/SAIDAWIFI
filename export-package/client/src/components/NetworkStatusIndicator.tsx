import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function NetworkStatusIndicator({ 
  className, 
  showText = false,
  position = 'top-right'
}: NetworkStatusIndicatorProps) {
  const networkStatus = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [lastStatus, setLastStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Show notification when network status changes
    if (lastStatus !== null && lastStatus !== networkStatus.isOnline) {
      setShowNotification(true);
      
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    
    setLastStatus(networkStatus.isOnline);
  }, [networkStatus.isOnline, lastStatus]);

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return 'text-red-500';
    switch (networkStatus.connectionStrength) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    if (networkStatus.isConnecting) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (!networkStatus.isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (networkStatus.isConnecting) return 'جارٍ الاتصال...';
    if (!networkStatus.isOnline) return 'غير متصل';
    
    switch (networkStatus.connectionStrength) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'poor': return 'ضعيف';
      default: return 'متصل';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
    }
  };

  const pulseAnimation = {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      repeat: networkStatus.isConnecting ? Infinity : 0,
      ease: "easeInOut"
    }
  };

  const connectionAnimation = {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 0, opacity: 0, rotate: 180 },
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      duration: 0.3
    }
  };

  return (
    <>
      {/* Main Status Indicator */}
      <motion.div
        className={cn(
          'fixed z-50 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border',
          getPositionClasses(),
          className
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={pulseAnimation}
          className={cn('flex items-center', getStatusColor())}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={networkStatus.isOnline ? 'online' : 'offline'}
              {...connectionAnimation}
            >
              {getStatusIcon()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        
        {showText && (
          <motion.span
            className={cn('text-sm font-medium', getStatusColor())}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {getStatusText()}
          </motion.span>
        )}
        
        {/* Signal Strength Bars */}
        {networkStatus.isOnline && !networkStatus.isConnecting && (
          <div className="flex items-end gap-1">
            {[1, 2, 3].map((bar) => {
              const shouldShow = 
                (networkStatus.connectionStrength === 'excellent') ||
                (networkStatus.connectionStrength === 'good' && bar <= 2) ||
                (networkStatus.connectionStrength === 'poor' && bar <= 1);
                
              return (
                <motion.div
                  key={bar}
                  className={cn(
                    'bg-current w-1 rounded-sm',
                    getStatusColor()
                  )}
                  style={{ height: `${bar * 3 + 2}px` }}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: shouldShow ? 1 : 0.3 }}
                  transition={{ delay: bar * 0.1, duration: 0.3 }}
                />
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Status Change Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className={cn(
              'fixed top-20 right-4 z-[60] flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border',
              networkStatus.isOnline ? 'border-green-200' : 'border-red-200'
            )}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            <motion.div
              className={networkStatus.isOnline ? 'text-green-500' : 'text-red-500'}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.5 }}
            >
              {networkStatus.isOnline ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </motion.div>
            
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {networkStatus.isOnline ? 'تم الاتصال بالإنترنت' : 'انقطع الاتصال بالإنترنت'}
              </p>
              {networkStatus.isOnline && networkStatus.lastConnected && (
                <p className="text-xs text-gray-500">
                  {networkStatus.lastConnected.toLocaleTimeString('ar-SA')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NetworkStatusIndicator;