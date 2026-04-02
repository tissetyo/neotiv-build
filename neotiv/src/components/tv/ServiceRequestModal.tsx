'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: { id: string; name: string; icon: string | null } | null;
}

export default function ServiceRequestModal({ isOpen, onClose, service }: ServiceRequestModalProps) {
  const store = useRoomStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.service-focusable' });

  useEffect(() => {
    if (isOpen && store.roomId && store.hotelId && !sessionId) {
      setLoading(true);
      fetch(`/api/room/${store.roomId}/mobile-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: store.hotelId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sessionId) setSessionId(data.sessionId);
          else setError(data.error || 'Failed to initialize session');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, store.roomId, store.hotelId, sessionId]);

  if (!service) return null;

  // The public URL that the user's phone will navigate to
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = sessionId ? `${originUrl}/${store.hotelSlug}/mobile/${sessionId}` : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-[4vw]"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-[800px] h-[500px] overflow-hidden flex"
          >
            {/* Left side: Instructions */}
            <div className="w-1/2 p-8 flex flex-col justify-center border-r border-white/10 relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors service-focusable" 
                tabIndex={0}>
                ← Back
              </button>
              
              <div className="mt-8">
                <h2 className="text-white text-3xl font-bold mb-4">
                  Order from your Phone
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  Scan the QR code to open the Hotel Services portal directly on your device. 
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/90">
                     <span className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">1</span>
                     <span>Browse menus & services</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                     <span className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">2</span>
                     <span>Add to your cart & checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                     <span className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">3</span>
                     <span>Chat directly with Front Desk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: QR Code */}
            <div className="w-1/2 p-8 flex flex-col items-center justify-center bg-white/5">
              {loading ? (
                <div className="w-[250px] h-[250px] rounded-2xl bg-white/10 animate-pulse flex items-center justify-center">
                  <span className="text-white/50">Generating code...</span>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center px-6">
                  <span className="text-4xl mb-2 block">⚠️</span>
                  <p>{error}</p>
                </div>
              ) : qrUrl ? (
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <QRCode value={qrUrl} size={220} />
                </div>
              ) : null}
              
              <p className="text-white/40 text-sm mt-6 font-mono text-center">
                Secure connection<br/>Session valid for 60 minutes
              </p>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
