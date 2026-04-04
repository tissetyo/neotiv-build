'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/stores/roomStore';
import { X, ChevronLeft, ChevronRight, Sparkles, Calendar } from 'lucide-react';

interface Promo {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PromoModal({ isOpen, onClose }: Props) {
  const store = useRoomStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Use server API (bypasses RLS) so STBs without auth cookies can see promos
  const { data: promos } = useSWR(
    isOpen && store.hotelSlug ? `/api/hotel/${store.hotelSlug}/promos` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.promos || []) as Promo[];
    },
    { refreshInterval: 0 }
  );

  // Auto-slideshow every 5 seconds when more than 2 promos and no detail selected
  useEffect(() => {
    if (!promos || promos.length <= 2 || selectedPromo) {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      return;
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [promos, selectedPromo]);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setSelectedPromo(null);
    }
  }, [isOpen]);

  // D-pad/keyboard navigation
  useEffect(() => {
    if (!isOpen || !promos?.length) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedPromo) {
          setSelectedPromo(null);
        } else {
          onClose();
        }
        return;
      }
      if (selectedPromo) return; // No carousel nav in detail view

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % promos.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setSelectedPromo(promos[currentIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, promos, currentIndex, selectedPromo, onClose]);

  const goNext = useCallback(() => {
    if (!promos) return;
    setCurrentIndex((prev) => (prev + 1) % promos.length);
  }, [promos]);

  const goPrev = useCallback(() => {
    if (!promos) return;
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
  }, [promos]);

  if (!isOpen) return null;

  const total = promos?.length ?? 0;

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
            style={{ background: 'rgba(30, 20, 15, 0.85)', backdropFilter: 'blur(20px)' }}
            onClick={() => (selectedPromo ? setSelectedPromo(null) : onClose())}
          />

          {/* Content */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[2.5vw] h-[2.5vw] rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-[1.3vw] h-[1.3vw] text-white/80" />
                </div>
                <h2 className="text-white text-[1.4vw] font-bold tracking-tight">Hotel Deals</h2>
              </div>
              <button
                onClick={onClose}
                className="w-[2.2vw] h-[2.2vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                tabIndex={0}
              >
                <X className="w-[1vw] h-[1vw] text-white/70" />
              </button>
            </div>

            {/* Main area */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {selectedPromo ? (
                  /* ===== DETAIL VIEW ===== */
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex gap-[2vw] items-start max-w-[70vw]"
                  >
                    {/* Large image */}
                    <div className="w-[35vw] rounded-2xl overflow-hidden shadow-2xl flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                      <img
                        src={selectedPromo.poster_url!}
                        alt={selectedPromo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detail text */}
                    <div className="flex flex-col justify-center py-[2vh]">
                      <h3 className="text-white text-[1.8vw] font-bold mb-[1vh]">{selectedPromo.title}</h3>

                      {(selectedPromo.valid_from || selectedPromo.valid_until) && (
                        <div className="flex items-center gap-[0.4vw] mb-[1.5vh]">
                          <Calendar className="w-[0.9vw] h-[0.9vw] text-teal-400" />
                          <span className="text-teal-400 text-[0.8vw] font-medium">
                            {selectedPromo.valid_from
                              ? new Date(selectedPromo.valid_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : ''}
                            {selectedPromo.valid_from && selectedPromo.valid_until ? ' — ' : ''}
                            {selectedPromo.valid_until
                              ? new Date(selectedPromo.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : ''}
                          </span>
                        </div>
                      )}

                      {selectedPromo.description && (
                        <p className="text-white/70 text-[0.9vw] leading-relaxed max-w-[25vw]">
                          {selectedPromo.description}
                        </p>
                      )}

                      <button
                        onClick={() => setSelectedPromo(null)}
                        className="mt-[3vh] px-[1.5vw] py-[0.8vh] rounded-xl bg-white/10 hover:bg-white/20 text-white text-[0.8vw] font-medium transition-colors self-start tv-focusable"
                        tabIndex={0}
                      >
                        ← Back to all deals
                      </button>
                    </div>
                  </motion.div>
                ) : total === 0 ? (
                  /* ===== EMPTY STATE ===== */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <Sparkles className="w-[3vw] h-[3vw] text-white/15 mx-auto mb-[1vh]" />
                    <p className="text-white/30 text-[1vw]">No deals available</p>
                  </motion.div>
                ) : (
                  /* ===== STACKED CARD CAROUSEL ===== */
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative flex items-center justify-center w-full"
                    style={{ height: '70vh' }}
                  >
                    {/* Nav arrows */}
                    {total > 1 && (
                      <>
                        <button
                          onClick={goPrev}
                          className="absolute left-[3vw] z-30 w-[2.5vw] h-[2.5vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                          tabIndex={0}
                        >
                          <ChevronLeft className="w-[1.2vw] h-[1.2vw] text-white/70" />
                        </button>
                        <button
                          onClick={goNext}
                          className="absolute right-[3vw] z-30 w-[2.5vw] h-[2.5vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors tv-focusable"
                          tabIndex={0}
                        >
                          <ChevronRight className="w-[1.2vw] h-[1.2vw] text-white/70" />
                        </button>
                      </>
                    )}

                    {/* Card stack */}
                    <div className="relative" style={{ width: '28vw', height: '65vh', perspective: '1200px' }}>
                      {promos?.map((promo, idx) => {
                        const offset = idx - currentIndex;
                        // Wrap around for circular
                        let adjustedOffset = offset;
                        if (total > 2) {
                          if (offset > total / 2) adjustedOffset = offset - total;
                          if (offset < -total / 2) adjustedOffset = offset + total;
                        }

                        // Only render nearby cards
                        if (Math.abs(adjustedOffset) > 2) return null;

                        const isCenter = adjustedOffset === 0;
                        const scale = isCenter ? 1 : 0.78 - Math.abs(adjustedOffset) * 0.05;
                        const translateX = adjustedOffset * 110; // % offset
                        const zIndex = 20 - Math.abs(adjustedOffset);
                        const opacity = isCenter ? 1 : Math.max(0.4, 0.7 - Math.abs(adjustedOffset) * 0.2);
                        const rotateY = adjustedOffset * -5;

                        return (
                          <motion.div
                            key={promo.id}
                            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                            style={{
                              zIndex,
                              transformOrigin: 'center center',
                            }}
                            animate={{
                              x: `${translateX}%`,
                              scale,
                              opacity,
                              rotateY,
                            }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                            onClick={() => {
                              if (isCenter) {
                                setSelectedPromo(promo);
                              } else {
                                setCurrentIndex(idx);
                              }
                            }}
                          >
                            <img
                              src={promo.poster_url!}
                              alt={promo.title}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                            {/* Title overlay */}
                            {isCenter && (
                              <div className="absolute bottom-0 left-0 right-0 p-[1vw]" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                                <p className="text-white text-[0.9vw] font-bold truncate">{promo.title}</p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Dot indicators */}
                    {total > 1 && (
                      <div className="absolute bottom-[1vh] left-0 right-0 flex justify-center gap-[0.4vw]">
                        {promos?.map((_: Promo, idx: number) => (
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
