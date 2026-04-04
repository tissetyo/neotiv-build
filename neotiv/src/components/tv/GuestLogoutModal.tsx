'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestLogoutModal({ isOpen, onClose }: Props) {
  const store = useRoomStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.logout-focusable' });

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Global keydown for PIN pad (only when modal is open)
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (['Escape'].includes(e.key)) return; // handled by dpad hook
      if (/^[0-9]$/.test(e.key)) { handlePinInput(e.key); return; }
      if (e.key === 'Backspace') { handleBackspace(); return; }
      
      // Arrow keys navigate between buttons
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      
      const focused = document.activeElement as HTMLElement;
      const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-logout-key]'));
      const idx = btns.indexOf(focused);
      if (idx === -1) { btns[0]?.focus(); return; }
      let next = idx;
      if (e.key === 'ArrowRight') next = Math.min(idx + 1, btns.length - 1);
      if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
      if (e.key === 'ArrowDown') next = Math.min(idx + 3, btns.length - 1);
      if (e.key === 'ArrowUp') next = Math.max(idx - 3, 0);
      btns[next]?.focus();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, pin]);

  const handlePinInput = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) submitPin(newPin);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const submitPin = async (enteredPin: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/room/${store.roomId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid PIN');
        setPin('');
        setLoading(false);
        return;
      }
      
      // Success! Update local store to empty guest details
      const updates = { 
        guestName: '', 
        guestPhotoUrl: null, 
        checkoutDate: null, 
        welcomeMessage: null 
      };
      
      store.hydrate(updates);

      // Save to localStorage as well
      const key = `neotiv_room_${store.hotelSlug}_${store.roomCode}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const session = JSON.parse(stored);
          session.guestName = '';
          session.guestPhotoUrl = null;
          session.checkoutDate = null;
          session.welcomeMessage = null;
          localStorage.setItem(key, JSON.stringify(session));
        } catch {}
      }

      onClose();

      // Exit kiosk app if running in Neotiv STB wrapper
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).NeotivNative?.exitApp) {
          (window as any).NeotivNative.exitApp();
        }
      }, 500);
    } catch {
      setError('Connection error');
      setPin('');
    }
    setLoading(false);
  };

  // Auto focus active item
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const btn5 = document.querySelector<HTMLElement>('[data-logout-key="5"]');
        if (btn5) btn5.focus();
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative z-10 glass-card p-[3vw] text-center text-white min-w-[30vw] border border-white/10"
        >
          <h2 className="text-[1.8vw] font-bold mb-[1vh]" style={{ fontFamily: 'var(--font-display)' }}>Checkout Guest</h2>
          <p className="text-white/60 text-[1vw] mb-[3vh]">Enter Room PIN to checkout Room {store.roomCode}</p>
          
          <div className="flex justify-center gap-4 mb-[3vh]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-[1vw] h-[1vw] rounded-full ${i < pin.length ? 'bg-teal-400' : 'bg-white/30'}`} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-[0.8vw] max-w-[18vw] mx-auto">
            {['1','2','3','4','5','6','7','8','9','Cancel','0','⌫'].map((key) => (
              <button key={key} disabled={!key || loading}
                data-logout-key={key || undefined}
                onClick={() => {
                  if (key === '⌫') handleBackspace();
                  else if (key === 'Cancel') onClose();
                  else if (key) handlePinInput(key);
                }}
                className={`h-[3.5vw] rounded-xl text-[1.4vw] font-medium transition-colors 
                  ${key ? 'bg-white/10 hover:bg-teal-500/80 active:bg-teal-600 text-white logout-focusable focus:ring-4 focus:ring-teal-400/50' : 'invisible'}`}
                tabIndex={key ? 0 : -1}>
                {key}
              </button>
            ))}
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 mt-[2vh] text-[1vw]">{error}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
