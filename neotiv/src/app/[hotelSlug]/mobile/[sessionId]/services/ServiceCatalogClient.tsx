'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Info, Utensils, Car, Shirt, Coffee, Sparkles, Scissors, ShoppingBag, Map, Briefcase, Bell } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

// Standard icon library mapping
const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-4 h-4" />,
  Car: <Car className="w-4 h-4" />,
  Shirt: <Shirt className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Scissors: <Scissors className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Map: <Map className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />
};
import type { Service, ServiceOption } from '@/types';

interface CatalogProps {
  services: Service[];
  options: ServiceOption[];
  sessionId: string;
  roomCode: string;
  roomId: string;
  hotelId: string;
  hotelSlug: string;
}

export default function ServiceCatalogClient({ services, options, sessionId, roomCode, roomId, hotelId, hotelSlug }: CatalogProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>(services[0]?.id || '');
  const [cart, setCart] = useState<{ option: ServiceOption; quantity: number }[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const activeOptions = options.filter(o => o.service_id === activeCategory);

  const updateQuantity = (option: ServiceOption, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.option.id === option.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(item => item.option.id !== option.id);
        return prev.map(item => item.option.id === option.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { option, quantity: delta }];
      return prev;
    });
  };

  const getQty = (optionId: string) => cart.find(item => item.option.id === optionId)?.quantity || 0;
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.option.price * item.quantity), 0);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    // Build receipt string
    const cartText = cart.map(item => `- ${item.quantity}x ${item.option.name} (${formatRupiah(item.option.price * item.quantity)})`).join('\n');
    const totalText = `\n**Total: ${formatRupiah(totalPrice)}**`;
    const messageBody = `Hello, I would like to order the following services:\n\n${cartText}${totalText}\n\nPlease confirm my order.`;

    const supabase = createBrowserClient();
    
    // 1. Log chat message from Guest
    await supabase.from('chat_messages').insert({
      hotel_id: hotelId,
      room_id: roomId,
      sender_role: 'guest',
      sender_name: `Room ${roomCode}`,
      message: messageBody,
      is_read: false
    });

    // 2. Redirect to mobile chat
    router.push(`/${hotelSlug}/mobile/${sessionId}/chat`);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-teal-600 px-6 py-8 text-white rounded-b-[2.5rem] shadow-md">
        <h1 className="text-3xl font-bold mb-2">Order Service</h1>
        <p className="text-teal-100 text-sm">Select items from the catalog below.</p>
      </div>

      {/* Category Pills */}
      <div className="px-5 mt-6 mb-4 overflow-x-auto hide-scrollbar whitespace-nowrap pb-2">
        <div className="flex gap-3">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => setActiveCategory(service.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                activeCategory === service.id 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                 {ICONS[service.icon || ''] || <span className="text-sm">{service.icon}</span>} 
                 {service.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 px-5 pb-32 space-y-4">
        {activeOptions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No items configured for this category.</p>
          </div>
        ) : (
          activeOptions.map(option => {
            const qty = getQty(option.id);
            return (
              <div key={option.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform active:scale-[0.98]">
                <div>
                  <h3 className="font-bold text-slate-800">{option.name}</h3>
                  <p className="text-teal-600 font-bold text-sm mt-1">{formatRupiah(option.price)}</p>
                </div>
                
                {qty === 0 ? (
                  <button 
                    onClick={() => updateQuantity(option, 1)}
                    className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-full p-1 border border-slate-200">
                    <button 
                      onClick={() => updateQuantity(option, -1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-800 text-sm min-w-[20px] text-center">{qty}</span>
                    <button 
                      onClick={() => updateQuantity(option, 1)}
                      className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-[76px] left-0 right-0 max-w-md mx-auto px-5 z-40">
          <button 
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full bg-slate-900 border border-slate-700 shadow-2xl shadow-slate-900/30 rounded-2xl p-4 flex items-center justify-between text-white active:scale95 transition-transform disabled:opacity-75"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-teal-50">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-300 font-medium">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
                <p className="font-bold">{formatRupiah(totalPrice)}</p>
              </div>
            </div>
            <span className="font-bold text-sm bg-white text-slate-900 px-5 py-2.5 rounded-xl">
              {isCheckingOut ? 'Sending...' : 'Checkout'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
