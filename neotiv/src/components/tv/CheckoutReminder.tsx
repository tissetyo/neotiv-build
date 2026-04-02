'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CalendarCheck, CalendarPlus, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';

export function CheckoutWidget({ onOpenModal }: { onOpenModal: () => void }) {
  const store = useRoomStore();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!store.checkoutDate) return;
    
    // Check out is usually 12:00 PM on the checkout date
    const checkoutTime = new Date(`${store.checkoutDate}T12:00:00`);
    
    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = checkoutTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
         setTimeLeft('Overdue');
         return;
      }

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHrs > 24) {
         setTimeLeft(`${Math.floor(diffHrs / 24)} days`);
      } else {
         setTimeLeft(`${diffHrs}h ${diffMins}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [store.checkoutDate]);

  return (
    <button
      onClick={onOpenModal}
      className="tv-widget bg-indigo-600/90 hover:bg-indigo-500/90 text-white w-full h-full flex flex-col items-center justify-center tv-focusable border-2 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all animate-pulse-slow"
      tabIndex={0}
      style={{ '--widget-bg': 'rgba(79, 70, 229, 0.9)' } as React.CSSProperties}
    >
      <Clock className="w-[2vw] h-[2vw] mb-2 text-indigo-200" strokeWidth={2.5} />
      <span className="text-[1.1vw] font-bold tracking-tight leading-none mb-1">Check Out</span>
      <span className="text-[0.9vw] font-medium text-indigo-100">{timeLeft}</span>
      
      <div className="absolute inset-x-0 bottom-0 py-1.5 bg-black/20 text-[0.6vw] font-bold tracking-widest uppercase">
        Extend Stay
      </div>
    </button>
  );
}

export function CheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const store = useRoomStore();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.checkout-btn' });

  const handleRequest = async (type: 'Late Checkout' | 'Extend 1 Day') => {
     setStatus('sending');
     const supabase = createBrowserClient();
     
     await supabase.from('chat_messages').insert({
       hotel_id: store.hotelId!,
       room_id: store.roomId!,
       sender_role: 'guest',
       sender_name: store.guestName || 'Guest',
       message: `[Automated Request]\nI would like to request: ${type}. Please advise on availability and pricing.`
     });

     setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
           setStatus('idle');
           onClose();
        }, 3000);
     }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl bg-slate-900/80">
      <AnimatePresence>
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="glass-card w-[50vw] p-[3vw] relative"
        >
          <button onClick={onClose} className="absolute right-[2vw] top-[2vw] p-[0.5vw] bg-white/10 hover:bg-white/20 rounded-full text-white checkout-btn tv-focusable" tabIndex={0}>
             <X className="w-[1.5vw] h-[1.5vw]" />
          </button>

          <h2 className="text-[2.5vw] font-bold text-white mb-2 leading-tight font-display tracking-tight">Stay a little longer?</h2>
          <p className="text-[1vw] text-slate-300 mb-[3vw]">Your scheduled checkout is approaching. Are you enjoying your time and want more flexibility? Request an extension directly to the front desk.</p>

          {status === 'success' ? (
             <div className="text-center py-[2vw]">
                <div className="w-[4vw] h-[4vw] mx-auto rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/50">
                  <CalendarCheck className="w-[2vw] h-[2vw]" />
                </div>
                <h3 className="text-[1.5vw] font-bold text-white mb-1">Request Sent</h3>
                <p className="text-[1vw] text-slate-400">The front desk will review your request and reply via Chat soon.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 gap-[1.5vw]">
               <button 
                 onClick={() => handleRequest('Late Checkout')}
                 disabled={status === 'sending'}
                 className="bg-white/10 hover:bg-teal-500 hover:border-teal-400 border border-white/20 p-[2vw] rounded-2xl flex flex-col items-center text-center transition-all checkout-btn tv-focusable group"
                 tabIndex={0}
               >
                  <Clock className="w-[3vw] h-[3vw] text-slate-300 group-hover:text-white mb-3" />
                  <span className="text-[1.2vw] font-bold text-white tracking-wide">Late Checkout</span>
                  <span className="text-[0.8vw] text-slate-400 group-hover:text-teal-100 mt-2">Extend by a few hours. Subject to availability and a small fee.</span>
               </button>

               <button 
                 onClick={() => handleRequest('Extend 1 Day')}
                 disabled={status === 'sending'}
                 className="bg-white/10 hover:bg-indigo-600 hover:border-indigo-400 border border-white/20 p-[2vw] rounded-2xl flex flex-col items-center text-center transition-all checkout-btn tv-focusable group"
                 tabIndex={0}
               >
                  <CalendarPlus className="w-[3vw] h-[3vw] text-slate-300 group-hover:text-white mb-3" />
                  <span className="text-[1.2vw] font-bold text-white tracking-wide">Extend 1+ Days</span>
                  <span className="text-[0.8vw] text-slate-400 group-hover:text-indigo-100 mt-2">Book the room for another night. Guarantee your relaxation.</span>
               </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
