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

// Match the icon mapping used in admin/frontoffice settings/services
const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-[1.8vw] h-[1.8vw]" />,
  Car: <Car className="w-[1.8vw] h-[1.8vw]" />,
  Shirt: <Shirt className="w-[1.8vw] h-[1.8vw]" />,
  Coffee: <Coffee className="w-[1.8vw] h-[1.8vw]" />,
  Sparkles: <Sparkles className="w-[1.8vw] h-[1.8vw]" />,
  Scissors: <Scissors className="w-[1.8vw] h-[1.8vw]" />,
  ShoppingBag: <ShoppingBag className="w-[1.8vw] h-[1.8vw]" />,
  Map: <Map className="w-[1.8vw] h-[1.8vw]" />,
  Briefcase: <Briefcase className="w-[1.8vw] h-[1.8vw]" />,
  Bell: <Bell className="w-[1.8vw] h-[1.8vw]" />,
};

/** Render the icon — tries Lucide map first, falls back to raw text (emoji) */
function renderIcon(icon: string | null | undefined) {
  if (!icon) return <ConciergeBell className="w-[1.8vw] h-[1.8vw]" />;
  return ICONS[icon] || <span className="text-[1.8vw] leading-none">{icon}</span>;
}

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

  // NO auto-rotate — user navigates manually via D-pad or click

  const currentService = services?.[currentIndex];

  return (
    <button
      className="tv-widget-light flex-1 flex flex-col items-center justify-center w-full text-center tv-focusable group relative overflow-hidden"
      tabIndex={0}
      onClick={onOpenServices}
    >
      {/* Rotating icon — manual only */}
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
              {renderIcon(currentService.icon)}
            </motion.div>
          ) : (
            <ConciergeBell className="w-[1.8vw] h-[1.8vw] text-slate-800" strokeWidth={2} />
          )}
        </AnimatePresence>
      </div>

      <span className="text-slate-900 text-[0.8vw] font-bold tracking-wide">Hotel Services</span>

      {/* Dot indicators — shows selected state */}
      {services && services.length > 1 && (
        <div className="flex gap-[0.2vw] mt-[0.4vh]">
          {services.map((_: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-[0.6vw] h-[0.2vw] bg-teal-600'
                  : 'w-[0.2vw] h-[0.2vw] bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </button>
  );
}
