'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import { Utensils, Car, Shirt, Coffee, Sparkles, Scissors, ShoppingBag, Map, Briefcase, Bell, Plus, Minus, ShoppingCart, CheckCircle2, ArrowLeft } from 'lucide-react';
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

interface CartItem {
  option: ServiceOption;
  serviceName: string;
  quantity: number;
}

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete?: () => void;
  service: { id: string; name: string; icon: string | null } | null;
}

type Step = 'browse' | 'confirm' | 'done';

export default function ServiceRequestModal({ isOpen, onClose, onOrderComplete, service }: ServiceRequestModalProps) {
  const store = useRoomStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [step, setStep] = useState<Step>('browse');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useDpadNavigation({ enabled: isOpen && step !== 'done', onEscape: step === 'confirm' ? () => setStep('browse') : onClose, selector: '.service-focusable' });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('browse');
      setCart([]);
      setSelectedServiceId(null);
    }
  }, [isOpen]);

  // Fetch QR Session
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

  // Fetch Catalog
  const { data: categories = [] } = useSWR(
    isOpen && store.hotelId ? `catalog-${store.hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('services').select('*').eq('hotel_id', store.hotelId).order('sort_order');
      if (data && data.length > 0 && !selectedServiceId) setSelectedServiceId(data[0].id);
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

  const selectedCategoryName = categories.find((c) => c.id === selectedServiceId)?.name || '';

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const updateCart = useCallback((option: ServiceOption, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.option.id === option.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(item => item.option.id !== option.id);
        return prev.map(item => item.option.id === option.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { option, serviceName: selectedCategoryName, quantity: 1 }];
      return prev;
    });
  }, [selectedCategoryName]);

  const getQty = (optionId: string) => cart.find(item => item.option.id === optionId)?.quantity || 0;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.option.price * i.quantity, 0);

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);

    const cartText = cart.map(item => `- ${item.quantity}x ${item.option.name} (${formatRupiah(item.option.price * item.quantity)})`).join('\n');
    const totalText = `\nTotal: ${formatRupiah(totalPrice)}`;
    const messageBody = `🛎 New Service Order\n\n${cartText}${totalText}\n\nPlease confirm my order. Thank you!`;

    const supabase = createBrowserClient();
    await supabase.from('chat_messages').insert({
      hotel_id: store.hotelId!,
      room_id: store.roomId!,
      sender_role: 'guest',
      sender_name: store.guestName || 'Guest',
      message: messageBody,
    });

    setStep('done');
    setSubmitting(false);

    // Auto-transition: close modal and open chat after brief delay
    setTimeout(() => {
      onClose();
      onOrderComplete?.();
    }, 2500);
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
          onKeyDown={(e) => e.key === 'Escape' && (step === 'confirm' ? setStep('browse') : onClose())}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-[900px] h-[600px] overflow-hidden flex relative"
          >
            {/* ===== DONE OVERLAY ===== */}
            <AnimatePresence>
              {step === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <CheckCircle2 className="w-20 h-20 text-teal-400 mb-4 animate-bounce" />
                  <h2 className="text-3xl font-bold text-white mb-2">Order Sent!</h2>
                  <p className="text-xl text-teal-100/70 text-center max-w-md">Your order has been sent to the Front Desk. Opening chat so you can track it...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== CONFIRM STEP ===== */}
            {step === 'confirm' ? (
              <div className="w-full p-8 flex flex-col h-full">
                <button onClick={() => setStep('browse')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors service-focusable mb-4" tabIndex={0}>
                  <ArrowLeft className="w-4 h-4" /> Back to catalog
                </button>

                <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">Order Confirmation</h2>
                <p className="text-white/50 text-sm mb-6">Review your order before sending to the Front Desk.</p>

                <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 pr-2">
                  {cart.map((item, i) => (
                    <div key={item.option.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{item.option.name}</p>
                        <p className="text-white/40 text-xs">{item.serviceName}</p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCart(item.option, -1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white service-focusable" tabIndex={0}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                          <button onClick={() => updateCart(item.option, 1)} className="w-7 h-7 rounded-full bg-teal-500/80 hover:bg-teal-500 flex items-center justify-center text-white service-focusable" tabIndex={0}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-teal-400 font-bold text-sm w-[100px] text-right">{formatRupiah(item.option.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm">Total ({totalItems} items)</span>
                    <span className="text-white text-2xl font-bold">{formatRupiah(totalPrice)}</span>
                  </div>
                  <p className="text-white/30 text-xs mb-4">Payment will be arranged by the Front Desk after confirmation.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('browse')} className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors service-focusable" tabIndex={0}>
                      Add More Items
                    </button>
                    <button onClick={handleConfirmOrder} disabled={submitting} className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-400 transition-colors service-focusable disabled:opacity-50" tabIndex={0}>
                      {submitting ? 'Sending...' : '✓ Confirm Order'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ===== BROWSE STEP: Left Catalog ===== */}
                <div className="w-[60%] p-8 flex flex-col border-r border-white/10 relative h-full">
                  <button onClick={onClose} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors service-focusable pb-2 px-2" tabIndex={0}>
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

                    {/* Options / Packages with +/- */}
                    <div className="flex-1 overflow-y-auto pl-2 hide-scrollbar flex flex-col gap-3">
                      {options.map((opt) => {
                        const qty = getQty(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left service-focusable flex items-center justify-between gap-3"
                            tabIndex={0}
                          >
                            <div className="min-w-0 flex-1">
                              <h3 className="text-white font-bold leading-tight">{opt.name}</h3>
                              <span className="text-teal-400 font-medium text-sm">{formatRupiah(opt.price)}</span>
                            </div>
                            {qty === 0 ? (
                              <button onClick={() => updateCart(opt, 1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-teal-500 flex items-center justify-center text-white transition-colors service-focusable shrink-0" tabIndex={0}>
                                <Plus className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 bg-white/10 rounded-full p-1 shrink-0">
                                <button onClick={() => updateCart(opt, -1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500 flex items-center justify-center text-white service-focusable" tabIndex={0}>
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white font-bold text-sm min-w-[18px] text-center">{qty}</span>
                                <button onClick={() => updateCart(opt, 1)} className="w-7 h-7 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center text-white service-focusable" tabIndex={0}>
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {options.length === 0 && (
                        <div className="p-6 text-center text-white/30 border border-white/5 border-dashed rounded-xl mt-4">
                          No packages found in this category.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating checkout bar inside catalog */}
                  {cart.length > 0 && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => setStep('confirm')}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-colors service-focusable"
                        tabIndex={0}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Checkout ({totalItems} items · {formatRupiah(totalPrice)})
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* ===== BROWSE STEP: Right QR ===== */}
                <div className="w-[40%] p-8 flex flex-col items-center justify-center bg-slate-900/50">
                  <h3 className="text-white/90 text-2xl font-bold mb-3 text-center tracking-tight">Order via Mobile</h3>
                  <p className="text-center text-white/50 text-sm mb-10 px-4 leading-relaxed">
                    Scan this code to browse the entire catalog directly from your smartphone.
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
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
