import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed top-0 inset-x-0 z-[120] px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium backdrop-blur-xl border-b shadow-lg transition-colors ${
            isOnline
              ? 'bg-[#121212]/95 border-emerald-500/20 text-emerald-400'
              : 'bg-[#1A1A1A]/95 border-white/10 text-white/80'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi size={14} className="text-emerald-400" />
              <span>Back online. Streaming restored.</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-[#E5303D]" />
              <span>You're offline. Playing cached songs from your library.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
