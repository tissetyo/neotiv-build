'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import { SlidersHorizontal, Sun, Contrast, Palette, RotateCcw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisplaySettingsModal({ isOpen, onClose }: Props) {
  const store = useRoomStore();
  const hydrate = useRoomStore(s => s.hydrate);
  const config = (store.tvLayoutConfig && typeof store.tvLayoutConfig === 'object' ? store.tvLayoutConfig : {}) as any;

  const [brightness, setBrightness] = useState(config.theme?.brightness ?? 1);
  const [contrast, setContrast] = useState(config.theme?.contrast ?? 1);
  const [saturate, setSaturate] = useState(config.theme?.saturate ?? 1);

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.display-focusable' });

  // Sync from config when modal opens
  useEffect(() => {
    if (isOpen) {
      setBrightness(config.theme?.brightness ?? 1);
      setContrast(config.theme?.contrast ?? 1);
      setSaturate(config.theme?.saturate ?? 1);
    }
  }, [isOpen]);

  const applySettings = useCallback((b: number, c: number, s: number) => {
    const updatedConfig = {
      ...config,
      theme: {
        ...config.theme,
        brightness: b,
        contrast: c,
        saturate: s,
      },
    };
    hydrate({ tvLayoutConfig: updatedConfig });
  }, [config, hydrate]);

  const handleChange = useCallback((type: 'brightness' | 'contrast' | 'saturate', value: number) => {
    const clamped = Math.round(value * 100) / 100;
    let b = brightness, c = contrast, s = saturate;
    if (type === 'brightness') { b = clamped; setBrightness(clamped); }
    if (type === 'contrast') { c = clamped; setContrast(clamped); }
    if (type === 'saturate') { s = clamped; setSaturate(clamped); }
    applySettings(b, c, s);
  }, [brightness, contrast, saturate, applySettings]);

  const handleReset = useCallback(() => {
    setBrightness(1);
    setContrast(1);
    setSaturate(1);
    applySettings(1, 1, 1);
  }, [applySettings]);

  if (!isOpen) return null;

  const sliders = [
    { label: 'Brightness', icon: <Sun className="w-[1.2vw] h-[1.2vw]" />, value: brightness, type: 'brightness' as const, min: 0.5, max: 1.5, step: 0.05 },
    { label: 'Contrast', icon: <Contrast className="w-[1.2vw] h-[1.2vw]" />, value: contrast, type: 'contrast' as const, min: 0.5, max: 1.5, step: 0.05 },
    { label: 'Saturation', icon: <Palette className="w-[1.2vw] h-[1.2vw]" />, value: saturate, type: 'saturate' as const, min: 0.0, max: 2.0, step: 0.05 },
  ];

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
            style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)' }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative z-10 w-[40vw] max-w-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-[2vh]">
              <div className="flex items-center gap-[0.8vw]">
                <button
                  onClick={onClose}
                  className="w-[2.2vw] h-[2.2vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors display-focusable"
                  tabIndex={0}
                >
                  <X className="w-[1vw] h-[1vw] text-white/70" />
                </button>
                <div className="w-[2.5vw] h-[2.5vw] rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                  <SlidersHorizontal className="w-[1.3vw] h-[1.3vw]" />
                </div>
                <h2 className="text-white text-[1.4vw] font-bold tracking-tight">Display Settings</h2>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vh] rounded-full bg-white/10 hover:bg-white/20 transition-colors display-focusable"
                tabIndex={0}
              >
                <RotateCcw className="w-[0.8vw] h-[0.8vw] text-white/70" />
                <span className="text-white/70 text-[0.7vw] font-medium">Reset</span>
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-[2vh]">
              {sliders.map((s) => (
                <div key={s.type} className="p-[1.2vw] rounded-2xl display-focusable focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-[1vh]">
                    <div className="flex items-center gap-[0.5vw] text-white/80">
                      {s.icon}
                      <span className="text-[0.85vw] font-semibold">{s.label}</span>
                    </div>
                    <span className="text-teal-400 text-[0.8vw] font-bold">{Math.round(s.value * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-[0.6vw]">
                    <button
                      onClick={() => handleChange(s.type, Math.max(s.min, s.value - s.step))}
                      className="w-[1.8vw] h-[1.8vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-[0.8vw] display-focusable shrink-0"
                      tabIndex={0}
                    >−</button>
                    <div className="flex-1 h-[0.5vw] rounded-full bg-white/10 relative overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${((s.value - s.min) / (s.max - s.min)) * 100}%`,
                          background: 'linear-gradient(90deg, var(--color-teal), var(--color-teal-light))',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleChange(s.type, Math.min(s.max, s.value + s.step))}
                      className="w-[1.8vw] h-[1.8vw] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-[0.8vw] display-focusable shrink-0"
                      tabIndex={0}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-white/30 text-[0.6vw] mt-[2vh] text-center">Use D-pad to adjust. Press Escape to close.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
