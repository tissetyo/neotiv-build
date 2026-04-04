'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import { SlidersHorizontal, Sun, Contrast, Palette, RotateCcw, X, Maximize } from 'lucide-react';

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
  const [scale, setScale] = useState(config.theme?.scale ?? 1);

  const [isAdjusting, setIsAdjusting] = useState(false);
  const adjustTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.display-focusable' });

  // Sync from config when modal opens
  useEffect(() => {
    if (isOpen) {
      setBrightness(config.theme?.brightness ?? 1);
      setContrast(config.theme?.contrast ?? 1);
      setSaturate(config.theme?.saturate ?? 1);
      setScale(config.theme?.scale ?? 1);
    }
  }, [isOpen]);

  // Apply to local store (UI update only, preview)
  const previewSettings = useCallback((b: number, c: number, s: number) => {
    const updatedConfig = {
      ...config,
      theme: {
        ...config.theme,
        brightness: b,
        contrast: c,
        saturate: s,
        scale: Math.round(scale * 100) / 100, // Pass current scale
      },
    };
    hydrate({ tvLayoutConfig: updatedConfig });
  }, [config, hydrate, scale]);

  const handleChange = useCallback((type: 'brightness' | 'contrast' | 'saturate' | 'scale', value: number) => {
    const clamped = Math.round(value * 100) / 100;
    let b = brightness, c = contrast, s = saturate, zoom = scale;
    if (type === 'brightness') { b = clamped; setBrightness(clamped); }
    if (type === 'contrast') { c = clamped; setContrast(clamped); }
    if (type === 'saturate') { s = clamped; setSaturate(clamped); }
    if (type === 'scale') { zoom = clamped; setScale(clamped); }
    
    // Live preview
    const updatedConfig = {
      ...config,
      theme: { ...config.theme, brightness: b, contrast: c, saturate: s, scale: zoom },
    };
    hydrate({ tvLayoutConfig: updatedConfig });

    // Fade out backdrop
    setIsAdjusting(true);
    if (adjustTimeoutRef.current) clearTimeout(adjustTimeoutRef.current);
    adjustTimeoutRef.current = setTimeout(() => setIsAdjusting(false), 800);
  }, [brightness, contrast, saturate, scale, config, hydrate]);

  const handleReset = useCallback(() => {
    setBrightness(1);
    setContrast(1);
    setSaturate(1);
    setScale(1);
    const updatedConfig = {
      ...config,
      theme: { ...config.theme, brightness: 1, contrast: 1, saturate: 1, scale: 1 },
    };
    hydrate({ tvLayoutConfig: updatedConfig });
    setIsAdjusting(true);
    if (adjustTimeoutRef.current) clearTimeout(adjustTimeoutRef.current);
    adjustTimeoutRef.current = setTimeout(() => setIsAdjusting(false), 800);
  }, [config, hydrate]);

  const handleApply = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleLogout = useCallback(() => {
    // Clear all configuration from local storage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('neotiv_room_') || key === 'neotiv_stb_setup') {
        localStorage.removeItem(key);
      }
    });
    // Redirect to setup page
    window.location.href = '/setup-stb';
  }, []);

  if (!isOpen) return null;

  const sliders = [
    { label: 'Brightness', icon: <Sun className="w-[1.2vw] h-[1.2vw]" />, value: brightness, type: 'brightness' as const, min: 0.5, max: 1.5, step: 0.05 },
    { label: 'Contrast', icon: <Contrast className="w-[1.2vw] h-[1.2vw]" />, value: contrast, type: 'contrast' as const, min: 0.5, max: 1.5, step: 0.05 },
    { label: 'Saturation', icon: <Palette className="w-[1.2vw] h-[1.2vw]" />, value: saturate, type: 'saturate' as const, min: 0.0, max: 2.0, step: 0.05 },
    { label: 'Zoom (Ratio)', icon: <Maximize className="w-[1.2vw] h-[1.2vw]" />, value: scale, type: 'scale' as const, min: 0.8, max: 1.2, step: 0.02 },
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
            className="absolute inset-0 transition-opacity duration-300"
            style={{ 
              background: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(20px)',
              opacity: isAdjusting ? 0 : 1 
            }}
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

            <div className="mt-[3vh] flex flex-col gap-[1vh] items-center">
              <button
                onClick={handleApply}
                className="w-full py-[1.2vh] rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-[1vw] transition-colors display-focusable focus:ring-4 focus:ring-teal-400/30 mb-[1vh]"
                tabIndex={0}
              >
                Apply Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-[1vh] rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 font-bold text-[0.85vw] transition-colors display-focusable focus:ring-4 focus:ring-red-400/30"
                tabIndex={0}
              >
                Reset Setup (Logout)
              </button>
              <p className="text-white/40 text-[0.6vw] text-center mt-[1vh]">Use D-pad to adjust. Press Escape to close without applying.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
