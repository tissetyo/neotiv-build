'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlarmModal({ isOpen, onClose }: AlarmModalProps) {
  const store = useRoomStore();
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createBrowserClient();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      setNote('');
      // Default to 7:00 AM next day
      const now = new Date();
      setHours(7);
      setMinutes(0);
      setAmPm('AM');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!store.roomId || !store.hotelId) return;
    setSaving(true);

    // Calculate scheduled time
    const now = new Date();
    let scheduledHour = hours;
    if (amPm === 'PM' && hours !== 12) scheduledHour += 12;
    if (amPm === 'AM' && hours === 12) scheduledHour = 0;

    const scheduled = new Date(now);
    scheduled.setHours(scheduledHour, minutes, 0, 0);

    // If time is in the past today, set it for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const { error } = await supabase.from('alarms').insert({
      hotel_id: store.hotelId,
      room_id: store.roomId,
      scheduled_time: scheduled.toISOString(),
      note: note.trim() || null,
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    }
  };

  const adjustHours = (delta: number) => {
    setHours((h) => {
      const next = h + delta;
      if (next > 12) return 1;
      if (next < 1) return 12;
      return next;
    });
  };

  const adjustMinutes = (delta: number) => {
    setMinutes((m) => {
      const next = m + delta;
      if (next >= 60) return 0;
      if (next < 0) return 55;
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-[500px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <h2 className="text-white text-xl font-semibold">Set Wake-Up Alarm</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white text-2xl transition-colors tv-focusable"
                tabIndex={0}
              >
                ✕
              </button>
            </div>

            {saved ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-white text-xl font-semibold">Alarm Set!</p>
                <p className="text-white/60 mt-2">
                  Wake-up call at {hours}:{minutes.toString().padStart(2, '0')} {amPm}
                </p>
                <p className="text-white/40 text-sm mt-1">Front office has been notified.</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Time picker */}
                <div className="flex items-center justify-center gap-6 my-6">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => adjustHours(1)}
                      className="text-white/40 hover:text-white text-2xl p-2 tv-focusable rounded-lg"
                      tabIndex={0}
                    >
                      ▲
                    </button>
                    <span className="text-white text-5xl font-bold tabular-nums w-[80px] text-center"
                      style={{ fontFamily: 'var(--font-body)' }}>
                      {hours.toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => adjustHours(-1)}
                      className="text-white/40 hover:text-white text-2xl p-2 tv-focusable rounded-lg"
                      tabIndex={0}
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-white text-5xl font-bold">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => adjustMinutes(5)}
                      className="text-white/40 hover:text-white text-2xl p-2 tv-focusable rounded-lg"
                      tabIndex={0}
                    >
                      ▲
                    </button>
                    <span className="text-white text-5xl font-bold tabular-nums w-[80px] text-center"
                      style={{ fontFamily: 'var(--font-body)' }}>
                      {minutes.toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => adjustMinutes(-5)}
                      className="text-white/40 hover:text-white text-2xl p-2 tv-focusable rounded-lg"
                      tabIndex={0}
                    >
                      ▼
                    </button>
                  </div>

                  {/* AM/PM */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setAmPm('AM')}
                      className={`px-4 py-2 rounded-lg text-lg font-semibold transition-colors tv-focusable ${
                        amPm === 'AM' ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/50'
                      }`}
                      tabIndex={0}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setAmPm('PM')}
                      className={`px-4 py-2 rounded-lg text-lg font-semibold transition-colors tv-focusable ${
                        amPm === 'PM' ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/50'
                      }`}
                      tabIndex={0}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4">
                  <label className="block text-white/50 text-sm mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Early flight tomorrow"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all tv-focusable disabled:opacity-50"
                  style={{ background: 'var(--color-teal)' }}
                  tabIndex={0}
                >
                  {saving ? 'Setting...' : 'Set Alarm'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
