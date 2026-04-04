'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/stores/roomStore';
import { Sparkles } from 'lucide-react';

interface Props {
  onOpenPromos?: () => void;
}

export default function HotelDeals({ onOpenPromos }: Props) {
  const store = useRoomStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use server API (bypasses RLS) so STBs without auth cookies can see promos
  const { data: promos } = useSWR(
    store.hotelSlug ? `/api/hotel/${store.hotelSlug}/promos` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.promos || [];
    },
    { refreshInterval: 120000 }
  );

  useEffect(() => {
    if (!promos || promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promos]);

  const hasPromos = promos && promos.length > 0;

  return (
    <div
      className="tv-widget h-full flex flex-col tv-focusable relative"
      tabIndex={0}
      onClick={hasPromos ? onOpenPromos : undefined}
      style={{ cursor: hasPromos ? 'pointer' : 'default' }}
    >
      <div className="flex items-center justify-between mb-3 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-[1.2vw]">✨</span>
          <span className="text-white text-[1vw] font-semibold">Hotel Deals</span>
        </div>
        {hasPromos && (
          <span className="text-white/50 text-[0.7vw]">→</span>
        )}
      </div>
      <div className="flex-1 overflow-hidden rounded-xl relative">
        <AnimatePresence mode="wait">
          {hasPromos ? (
            <motion.img
              key={currentIndex}
              src={promos[currentIndex].poster_url}
              alt="Promo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full object-cover rounded-xl absolute inset-0"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full absolute inset-0 rounded-xl flex flex-col items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Sparkles className="w-[2vw] h-[2vw] text-white/20 mb-[0.5vh]" />
              <span className="text-white/30 text-[0.8vw] font-medium">No deals available</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicators */}
        {hasPromos && promos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
            {promos.map((_: any, idx: number) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
