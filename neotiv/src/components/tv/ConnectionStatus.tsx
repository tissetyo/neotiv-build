'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "Back Online" briefly then hide
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setShowBanner(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2"
          style={{
            background: isOnline ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
            backdropFilter: 'blur(8px)',
            color: 'white',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: 'white',
              animation: isOnline ? 'none' : 'pulse 1.5s ease-in-out infinite',
            }}
          />
          {isOnline ? 'Back Online' : 'Offline — Actions will be queued'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
