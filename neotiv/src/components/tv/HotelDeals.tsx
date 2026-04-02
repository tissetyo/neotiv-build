'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';

export default function HotelDeals() {
  const store = useRoomStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: promos } = useSWR(
    store.hotelId ? `promos-${store.hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('promos')
        .select('poster_url')
        .eq('hotel_id', store.hotelId!)
        .eq('is_active', true)
        .not('poster_url', 'is', null)
        .order('created_at', { ascending: false });
      return data || [];
    },
    { refreshInterval: 120000 } // Refresh every 2 mins
  );

  useEffect(() => {
    if (!promos || promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 6000); // 6 second loop
    return () => clearInterval(interval);
  }, [promos]);

  return (
    <div className="tv-widget h-full flex flex-col tv-focusable relative" tabIndex={0}>
      <div className="flex items-center justify-between mb-3 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-[1.2vw]">✨</span>
          <span className="text-white text-[1vw] font-semibold">Hotel Deals</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl relative">
        <AnimatePresence mode="wait">
          {promos && promos.length > 0 ? (
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
            <img src="/promo.png" alt="Placeholder" className="w-full h-full object-cover rounded-xl absolute inset-0" />
          )}
        </AnimatePresence>
        
        {/* Indicators */}
        {promos && promos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
            {promos.map((_, idx) => (
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
