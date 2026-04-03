'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import {
  Utensils, Car, Shirt, Coffee, Sparkles, Scissors, ShoppingBag, Map, Briefcase, Bell,
  ConciergeBell, Plus, Minus, ShoppingCart, CheckCircle2, ArrowLeft, X, ChevronLeft, ChevronRight, QrCode
} from 'lucide-react';
import type { Service, ServiceOption } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-8 h-8" />,
  Car: <Car className="w-8 h-8" />,
  Shirt: <Shirt className="w-8 h-8" />,
  Coffee: <Coffee className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Scissors: <Scissors className="w-8 h-8" />,
  ShoppingBag: <ShoppingBag className="w-8 h-8" />,
  Map: <Map className="w-8 h-8" />,
  Briefcase: <Briefcase className="w-8 h-8" />,
  Bell: <Bell className="w-8 h-8" />,
  ConciergeBell: <ConciergeBell className="w-8 h-8" />,
};

const LARGE_ICON: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-16 h-16" />,
  Car: <Car className="w-16 h-16" />,
  Shirt: <Shirt className="w-16 h-16" />,
  Coffee: <Coffee className="w-16 h-16" />,
  Sparkles: <Sparkles className="w-16 h-16" />,
  Scissors: <Scissors className="w-16 h-16" />,
  ShoppingBag: <ShoppingBag className="w-16 h-16" />,
  Map: <Map className="w-16 h-16" />,
  Briefcase: <Briefcase className="w-16 h-16" />,
  Bell: <Bell className="w-16 h-16" />,
  ConciergeBell: <ConciergeBell className="w-16 h-16" />,
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
}

type Step = 'carousel' | 'items' | 'confirm' | 'done';

export default function ServiceRequestModal({ isOpen, onClose, onOrderComplete }: ServiceRequestModalProps) {
  const store = useRoomStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [step, setStep] = useState<Step>('carousel');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('carousel');
      setCart([]);
      setSelectedService(null);
      setCurrentIndex(0);
      setShowQr(false);
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

  // Fetch service categories
  const { data: categories = [] } = useSWR(
    isOpen && store.hotelId ? `service-cats-${store.hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('services').select('*').eq('hotel_id', store.hotelId).order('sort_order');
      return (data || []) as Service[];
    }
  );

  // Fetch options for selected service
  const { data: options = [] } = useSWR(
    isOpen && selectedService ? `svc-opts-${selectedService.id}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('service_options').select('*').eq('service_id', selectedService!.id);
      return (data || []) as ServiceOption[];
    }
  );

  // Auto-slideshow every 5 seconds in carousel step
  useEffect(() => {
    if (step !== 'carousel' || !categories.length || categories.length <= 2) {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      return;
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % categories.length);
    }, 5000);
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [step, categories]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (showQr) { setShowQr(false); return; }
        if (step === 'confirm') { setStep('items'); return; }
        if (step === 'items') { setStep('carousel'); setSelectedService(null); return; }
        onClose();
        return;
      }
      if (step === 'carousel' && categories.length > 0) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentIndex((prev) => (prev + 1) % categories.length);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setSelectedService(categories[currentIndex]);
          setStep('items');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, step, categories, currentIndex, showQr, onClose]);

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const updateCart = useCallback((option: ServiceOption, delta: number) => {
    const serviceName = selectedService?.name || '';
    setCart(prev => {
      const existing = prev.find(item => item.option.id === option.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(item => item.option.id !== option.id);
        return prev.map(item => item.option.id === option.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { option, serviceName, quantity: 1 }];
      return prev;
    });
  }, [selectedService]);

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
    setTimeout(() => {
      onClose();
      onOrderComplete?.();
    }, 2500);
  };

  if (!isOpen) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = sessionId ? `${originUrl}/${store.hotelSlug}/mobile/${sessionId}/services` : '';
  const total = categories.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(20px)' }}
            onClick={() => {
              if (showQr) { setShowQr(false); return; }
              if (step === 'items') { setStep('carousel'); setSelectedService(null); return; }
              if (step === 'confirm') { setStep('items'); return; }
              onClose();
            }}
          />

          {/* ===== DONE OVERLAY ===== */}
          <AnimatePresence>
            {step === 'done' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
                style={{ background: 'rgba(15, 23, 42, 0.95)' }}
              >
                <CheckCircle2 className="w-20 h-20 text-teal-400 mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold text-white mb-2">Order Sent!</h2>
                <p className="text-xl text-teal-100/70 text-center max-w-md">Your order has been sent to the Front Desk. Opening chat...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== QR OVERLAY ===== */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10001] flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.9)' }}
                onClick={() => setShowQr(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass-card p-12 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ConciergeBell className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                  <h2 className="text-white text-2xl font-bold mb-2">Order via Mobile</h2>
                  <p className="text-white/50 mb-6 max-w-sm">Scan this QR code to browse and order services from your phone.</p>
                  {loadingQr ? (
                    <div className="w-[200px] h-[200px] bg-white/10 rounded-2xl animate-pulse mx-auto" />
                  ) : qrUrl ? (
                    <div className="bg-white p-4 rounded-3xl inline-block shadow-[0_0_40px_rgba(20,184,166,0.15)]">
                      <QRCode value={qrUrl} size={200} />
                    </div>
                  ) : null}
                  <button onClick={() => setShowQr(false)} className="mt-6 px-8 py-3 rounded-xl font-semibold text-white tv-focusable" style={{ background: 'var(--color-teal)' }} tabIndex={0}>
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
              <div className="flex items-center gap-[0.8vw]">
                {step !== 'carousel' && (
                  <button
                    onClick={() => {
                      if (step === 'confirm') setStep('items');
                      else if (step === 'items') { setStep('carousel'); setSelectedService(null); }
                    }}
                    className="w-[2.2vw] h-[2.2vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable mr-[0.4vw]"
                    tabIndex={0}
                  >
                    <ArrowLeft className="w-[1vw] h-[1vw] text-white/70" />
                  </button>
                )}
                <div className="w-[2.5vw] h-[2.5vw] rounded-xl bg-white/10 flex items-center justify-center">
                  <ConciergeBell className="w-[1.3vw] h-[1.3vw] text-white/80" />
                </div>
                <h2 className="text-white text-[1.4vw] font-bold tracking-tight">
                  {step === 'carousel' ? 'Hotel Services' : step === 'items' ? selectedService?.name || 'Services' : 'Order Confirmation'}
                </h2>
              </div>
              <div className="flex items-center gap-[0.6vw]">
                {/* QR Button */}
                <button
                  onClick={() => setShowQr(true)}
                  className="w-[2.2vw] h-[2.2vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                  tabIndex={0}
                  title="Order via Mobile"
                >
                  <QrCode className="w-[1vw] h-[1vw] text-white/70" />
                </button>
                {/* Cart indicator */}
                {totalItems > 0 && step !== 'confirm' && (
                  <button
                    onClick={() => setStep('confirm')}
                    className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vh] rounded-full bg-teal-500 hover:bg-teal-400 transition-colors tv-focusable"
                    tabIndex={0}
                  >
                    <ShoppingCart className="w-[0.9vw] h-[0.9vw] text-white" />
                    <span className="text-white text-[0.7vw] font-bold">{totalItems}</span>
                  </button>
                )}
                {/* Close */}
                <button
                  onClick={onClose}
                  className="w-[2.2vw] h-[2.2vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                  tabIndex={0}
                >
                  <X className="w-[1vw] h-[1vw] text-white/70" />
                </button>
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 'carousel' ? (
                  /* ===== SERVICE CARD STACK CAROUSEL ===== */
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative flex items-center justify-center w-full"
                    style={{ height: '70vh' }}
                  >
                    {total === 0 ? (
                      <div className="text-center">
                        <ConciergeBell className="w-[3vw] h-[3vw] text-white/15 mx-auto mb-[1vh]" />
                        <p className="text-white/30 text-[1vw]">No services available</p>
                      </div>
                    ) : (
                      <>
                        {/* Nav arrows */}
                        {total > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
                              className="absolute left-[3vw] z-30 w-[2.5vw] h-[2.5vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                              tabIndex={0}
                            >
                              <ChevronLeft className="w-[1.2vw] h-[1.2vw] text-white/70" />
                            </button>
                            <button
                              onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
                              className="absolute right-[3vw] z-30 w-[2.5vw] h-[2.5vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                              tabIndex={0}
                            >
                              <ChevronRight className="w-[1.2vw] h-[1.2vw] text-white/70" />
                            </button>
                          </>
                        )}

                        {/* Card stack */}
                        <div className="relative" style={{ width: '22vw', height: '55vh', perspective: '1200px' }}>
                          {categories.map((cat, idx) => {
                            let offset = idx - currentIndex;
                            if (total > 2) {
                              if (offset > total / 2) offset = offset - total;
                              if (offset < -total / 2) offset = offset + total;
                            }
                            if (Math.abs(offset) > 2) return null;

                            const isCenter = offset === 0;
                            const scale = isCenter ? 1 : 0.78 - Math.abs(offset) * 0.05;
                            const translateX = offset * 120;
                            const zIndex = 20 - Math.abs(offset);
                            const opacity = isCenter ? 1 : Math.max(0.3, 0.6 - Math.abs(offset) * 0.2);

                            return (
                              <motion.div
                                key={cat.id}
                                className="absolute inset-0 rounded-3xl overflow-hidden cursor-pointer"
                                style={{ zIndex }}
                                animate={{ x: `${translateX}%`, scale, opacity }}
                                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                onClick={() => {
                                  if (isCenter) {
                                    setSelectedService(cat);
                                    setStep('items');
                                  } else {
                                    setCurrentIndex(idx);
                                  }
                                }}
                              >
                                {/* Card face */}
                                <div
                                  className="w-full h-full flex flex-col items-center justify-center gap-[2vh]"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(15,23,42,0.6) 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(20px)',
                                  }}
                                >
                                  <div className="w-[6vw] h-[6vw] rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
                                    {LARGE_ICON[cat.icon || ''] || <ConciergeBell className="w-16 h-16" />}
                                  </div>
                                  <p className="text-white text-[1.2vw] font-bold tracking-tight">{cat.name}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Dot indicators */}
                        {total > 1 && (
                          <div className="absolute bottom-[2vh] left-0 right-0 flex justify-center gap-[0.4vw]">
                            {categories.map((_: Service, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`rounded-full transition-all duration-300 ${
                                  idx === currentIndex
                                    ? 'w-[1.5vw] h-[0.35vw] bg-white'
                                    : 'w-[0.35vw] h-[0.35vw] bg-white/30 hover:bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ) : step === 'items' ? (
                  /* ===== ITEMS GRID ===== */
                  <motion.div
                    key="items"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[60vw] mx-auto px-[2vw] flex flex-col"
                    style={{ maxHeight: '75vh' }}
                  >
                    {/* Service header */}
                    <div className="flex items-center gap-[0.8vw] mb-[2vh]">
                      <div className="w-[3vw] h-[3vw] rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                        {ICON_MAP[selectedService?.icon || ''] || <ConciergeBell className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-white text-[1.2vw] font-bold">{selectedService?.name}</h3>
                        <p className="text-white/40 text-[0.7vw]">{options.length} items available</p>
                      </div>
                    </div>

                    {/* Items grid */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 gap-[0.8vw]">
                      {options.map((opt) => {
                        const qty = getQty(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className="p-[1vw] rounded-2xl flex items-center justify-between gap-[0.6vw] tv-focusable"
                            style={{
                              background: qty > 0 ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.06)',
                              border: qty > 0 ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                            tabIndex={0}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white text-[0.85vw] font-bold truncate">{opt.name}</h4>
                              <span className="text-teal-400 text-[0.7vw] font-medium">{formatRupiah(opt.price)}</span>
                            </div>
                            {qty === 0 ? (
                              <button
                                onClick={() => updateCart(opt, 1)}
                                className="w-[2vw] h-[2vw] rounded-full bg-white/10 hover:bg-teal-500 flex items-center justify-center text-white transition-colors tv-focusable shrink-0"
                                tabIndex={0}
                              >
                                <Plus className="w-[0.9vw] h-[0.9vw]" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-[0.3vw] bg-white/10 rounded-full px-[0.3vw] py-[0.2vw] shrink-0">
                                <button onClick={() => updateCart(opt, -1)} className="w-[1.6vw] h-[1.6vw] rounded-full bg-white/10 hover:bg-rose-500 flex items-center justify-center text-white tv-focusable" tabIndex={0}>
                                  <Minus className="w-[0.6vw] h-[0.6vw]" />
                                </button>
                                <span className="text-white font-bold text-[0.7vw] min-w-[1vw] text-center">{qty}</span>
                                <button onClick={() => updateCart(opt, 1)} className="w-[1.6vw] h-[1.6vw] rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center text-white tv-focusable" tabIndex={0}>
                                  <Plus className="w-[0.6vw] h-[0.6vw]" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {options.length === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center py-[4vh] text-white/20">
                          <ConciergeBell className="w-[2vw] h-[2vw] mb-[1vh]" />
                          <p className="text-[0.8vw]">No items in this category</p>
                        </div>
                      )}
                    </div>

                    {/* Floating checkout bar */}
                    {cart.length > 0 && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-[1.5vh] pt-[1.5vh] border-t border-white/10">
                        <button
                          onClick={() => setStep('confirm')}
                          className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-[1.2vh] rounded-xl flex items-center justify-center gap-[0.6vw] transition-colors tv-focusable text-[0.9vw]"
                          tabIndex={0}
                        >
                          <ShoppingCart className="w-[1vw] h-[1vw]" />
                          Checkout ({totalItems} items · {formatRupiah(totalPrice)})
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ) : step === 'confirm' ? (
                  /* ===== CONFIRM STEP ===== */
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[50vw] mx-auto px-[2vw] flex flex-col"
                    style={{ maxHeight: '75vh' }}
                  >
                    <p className="text-white/50 text-[0.75vw] mb-[2vh]">Review your order before sending to the Front Desk.</p>

                    <div className="flex-1 overflow-y-auto hide-scrollbar space-y-[0.6vw]">
                      {cart.map((item) => (
                        <div key={item.option.id} className="flex items-center justify-between p-[0.8vw] rounded-xl bg-white/5 border border-white/10">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-[0.85vw] truncate">{item.option.name}</p>
                            <p className="text-white/40 text-[0.6vw]">{item.serviceName}</p>
                          </div>
                          <div className="flex items-center gap-[0.8vw] ml-[1vw]">
                            <div className="flex items-center gap-[0.3vw]">
                              <button onClick={() => updateCart(item.option, -1)} className="w-[1.6vw] h-[1.6vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white tv-focusable" tabIndex={0}>
                                <Minus className="w-[0.5vw] h-[0.5vw]" />
                              </button>
                              <span className="text-white font-bold text-[0.7vw] min-w-[1vw] text-center">{item.quantity}</span>
                              <button onClick={() => updateCart(item.option, 1)} className="w-[1.6vw] h-[1.6vw] rounded-full bg-teal-500/80 hover:bg-teal-500 flex items-center justify-center text-white tv-focusable" tabIndex={0}>
                                <Plus className="w-[0.5vw] h-[0.5vw]" />
                              </button>
                            </div>
                            <span className="text-teal-400 font-bold text-[0.7vw] w-[5vw] text-right">{formatRupiah(item.option.price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-[1.5vh] mt-[1.5vh]">
                      <div className="flex items-center justify-between mb-[1vh]">
                        <span className="text-white/60 text-[0.75vw]">Total ({totalItems} items)</span>
                        <span className="text-white text-[1.4vw] font-bold">{formatRupiah(totalPrice)}</span>
                      </div>
                      <p className="text-white/30 text-[0.6vw] mb-[1.5vh]">Payment will be arranged by the Front Desk after confirmation.</p>
                      <div className="flex gap-[0.6vw]">
                        <button onClick={() => setStep('items')} className="flex-1 py-[1vh] rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors tv-focusable text-[0.8vw]" tabIndex={0}>
                          Add More Items
                        </button>
                        <button onClick={handleConfirmOrder} disabled={submitting} className="flex-1 py-[1vh] rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-400 transition-colors tv-focusable disabled:opacity-50 text-[0.8vw]" tabIndex={0}>
                          {submitting ? 'Sending...' : '✓ Confirm Order'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
