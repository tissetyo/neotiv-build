'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import { Utensils, Car, Shirt, Coffee, Sparkles, Scissors, ShoppingBag, Map, Briefcase, Bell, CheckCircle2 } from 'lucide-react';
import type { Service, ServiceOption } from '@/types';

const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Scissors: <Scissors className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Map: <Map className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />
};

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: { id: string; name: string; icon: string | null } | null;
}

export default function ServiceRequestModal({ isOpen, onClose, service }: ServiceRequestModalProps) {
  const store = useRoomStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useDpadNavigation({ enabled: isOpen && !orderSuccess, onEscape: onClose, selector: '.service-focusable' });

  // 1. Fetch QR Session
  useEffect(() => {
    if (isOpen && store.roomId && store.hotelId && !sessionId) {
      setLoadingQr(true);
      fetch(`/api/room/${store.roomId}/mobile-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: store.hotelId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sessionId) setSessionId(data.sessionId);
        })
        .finally(() => setLoadingQr(false));
    }
  }, [isOpen, store.roomId, store.hotelId, sessionId]);

  // 2. Fetch Catalog
  const { data: categories = [] } = useSWR(
    isOpen && store.hotelId ? `catalog-${store.hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('services').select('*').eq('hotel_id', store.hotelId).order('sort_order');
      if (data && data.length > 0) setSelectedServiceId(data[0].id);
      return data as Service[] || [];
    }
  );

  const { data: options = [] } = useSWR(
    isOpen && selectedServiceId ? `options-${selectedServiceId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('service_options').select('*').eq('service_id', selectedServiceId);
      return data as ServiceOption[] || [];
    }
  );

  const handleOrder = async (opt: ServiceOption) => {
    const supabase = createBrowserClient();
    await supabase.from('chat_messages').insert({
      hotel_id: store.hotelId!,
      room_id: store.roomId!,
      sender_role: 'guest',
      sender_name: store.guestName || 'Guest',
      message: `[Automated Order]\nI would like to order: ${opt.name} (Rp${opt.price.toLocaleString('id-ID')}). Please advise on delivery time.`
    });
    
    setOrderSuccess(opt.name);
    setTimeout(() => {
      setOrderSuccess(null);
      // Optional: don't close so they can order more, but usually closing is better UX.
    }, 3000);
  };

  if (!service) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = sessionId ? `${originUrl}/${store.hotelSlug}/mobile/${sessionId}` : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-[4vw]"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-[900px] h-[600px] overflow-hidden flex relative"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {orderSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <CheckCircle2 className="w-20 h-20 text-teal-400 mb-4 animate-bounce" />
                  <h2 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
                  <p className="text-xl text-teal-100/70 text-center max-w-md">Your order for "{orderSuccess}" has been sent. The Front Desk will message you shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Left side: TV Catalog */}
            <div className="w-[60%] p-8 flex flex-col border-r border-white/10 relative h-full">
              <button 
                onClick={onClose} 
                className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors service-focusable pb-2 px-2" 
                tabIndex={0}>
                ← Back
              </button>

              <h2 className="text-white text-3xl font-bold mt-10 mb-6 font-display tracking-tight border-b border-white/10 pb-4">
                Hotel Catalog
              </h2>

              <div className="flex flex-1 overflow-hidden gap-6">
                {/* Categories */}
                <div className="w-[40%] flex flex-col gap-2 overflow-y-auto pr-2 hide-scrollbar">
                   {categories.map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => setSelectedServiceId(cat.id)}
                       className={`p-3 rounded-xl flex items-center gap-3 transition-colors text-left service-focusable group shrink-0 ${
                         selectedServiceId === cat.id ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/20'
                       }`}
                       tabIndex={0}
                     >
                       <span className={`${selectedServiceId === cat.id ? 'text-slate-800' : 'text-slate-300'}`}>
                         {ICONS[cat.icon || 'Bell'] || ICONS['Bell']}
                       </span>
                       <span className="text-sm truncate">{cat.name}</span>
                     </button>
                   ))}
                </div>

                {/* Options / Packages */}
                <div className="flex-1 overflow-y-auto pl-2 hide-scrollbar flex flex-col gap-3">
                   {options.map((opt) => (
                     <button
                       key={opt.id}
                       onClick={() => handleOrder(opt)}
                       className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 focus:bg-white/20 transition-all text-left service-focusable group flex flex-col gap-2"
                       tabIndex={0}
                     >
                       <h3 className="text-white font-bold leading-tight group-focus:text-teal-300">{opt.name}</h3>
                       <div className="flex items-center justify-between mt-auto">
                         <span className="text-teal-400 font-medium text-sm">Rp{opt.price.toLocaleString('id-ID')}</span>
                         <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60 group-focus:bg-teal-500 group-focus:text-white transition-colors">Press Enter to order</span>
                       </div>
                     </button>
                   ))}
                   {options.length === 0 && (
                     <div className="p-6 text-center text-white/30 border border-white/5 border-dashed rounded-xl mt-4">
                       No packages found in this category.
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Right side: QR Code */}
            <div className="w-[40%] p-8 flex flex-col items-center justify-center bg-slate-900/50">
              <h3 className="text-white/90 text-2xl font-bold mb-3 text-center tracking-tight">Order via Mobile</h3>
              <p className="text-center text-white/50 text-sm mb-10 px-4 leading-relaxed">
                Scan this code to browse the entire catalog directly from your smartphone, comfortably.
              </p>

              {loadingQr ? (
                <div className="w-[200px] h-[200px] rounded-2xl bg-white/10 animate-pulse flex items-center justify-center">
                  <span className="text-white/50">Generating...</span>
                </div>
              ) : qrUrl ? (
                <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(20,184,166,0.15)] relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-indigo-500 opacity-20 blur-2xl -z-10 rounded-full" />
                  <QRCode value={qrUrl} size={180} />
                </div>
              ) : null}
              
              <div className="mt-8 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <p className="text-white/30 text-xs font-mono uppercase tracking-widest">
                   Synced Live to Room {store.roomCode}
                 </p>
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
