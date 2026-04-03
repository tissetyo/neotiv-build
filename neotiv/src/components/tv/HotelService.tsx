'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import {
  ConciergeBell, Utensils, Car, Shirt, Coffee, Sparkles,
  Scissors, ShoppingBag, Map, Briefcase, Bell
} from 'lucide-react';
import type { Service } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-[2vw] h-[2vw]" />,
  Car: <Car className="w-[2vw] h-[2vw]" />,
  Shirt: <Shirt className="w-[2vw] h-[2vw]" />,
  Coffee: <Coffee className="w-[2vw] h-[2vw]" />,
  Sparkles: <Sparkles className="w-[2vw] h-[2vw]" />,
  Scissors: <Scissors className="w-[2vw] h-[2vw]" />,
  ShoppingBag: <ShoppingBag className="w-[2vw] h-[2vw]" />,
  Map: <Map className="w-[2vw] h-[2vw]" />,
  Briefcase: <Briefcase className="w-[2vw] h-[2vw]" />,
  Bell: <Bell className="w-[2vw] h-[2vw]" />,
  ConciergeBell: <ConciergeBell className="w-[2vw] h-[2vw]" />,
};

interface Props {
  onOpenServices?: () => void;
}

export default function HotelService({ onOpenServices }: Props) {
  const store = useRoomStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: services } = useSWR(
    store.hotelId ? `services-widget-${store.hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('services')
        .select('id, name, icon')
        .eq('hotel_id', store.hotelId!)
        .order('sort_order');
      return (data || []) as Pick<Service, 'id' | 'name' | 'icon'>[];
    },
    { refreshInterval: 120000 }
  );

  // Auto-rotate through service icons every 4 seconds
  useEffect(() => {
    if (!services || services.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [services]);

  const currentService = services?.[currentIndex];

  return (
    <button
      className="tv-widget-light flex-1 flex flex-col items-center justify-center w-full text-center tv-focusable group relative overflow-hidden"
      tabIndex={0}
      onClick={onOpenServices}
    >
      {/* Rotating icon */}
      <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-slate-900/5 group-hover:bg-teal-500/10 flex items-center justify-center transition-colors mb-2">
        <AnimatePresence mode="wait">
          {currentService ? (
            <motion.div
              key={currentService.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-slate-800"
            >
              {ICON_MAP[currentService.icon || ''] || <ConciergeBell className="w-[2vw] h-[2vw]" />}
            </motion.div>
          ) : (
            <ConciergeBell className="w-[2vw] h-[2vw] text-slate-800" />
          )}
        </AnimatePresence>
      </div>

      <span className="text-slate-900 text-[0.8vw] font-bold tracking-wide">Hotel Services</span>

      {/* Dot indicators */}
      {services && services.length > 1 && (
        <div className="flex gap-[0.2vw] mt-[0.4vh]">
          {services.map((_: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-[0.6vw] h-[0.15vw] bg-slate-700'
                  : 'w-[0.15vw] h-[0.15vw] bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </button>
  );
}
