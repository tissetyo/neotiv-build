'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: { id: string; name: string; icon: string | null } | null;
}

export default function ServiceRequestModal({ isOpen, onClose, service }: ServiceRequestModalProps) {
  const store = useRoomStore();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createBrowserClient();

  useDpadNavigation({ enabled: isOpen && !sent, onEscape: onClose, selector: '.service-focusable' });

  const handleSubmit = async () => {
    if (!service || !store.roomId || !store.hotelId) return;
    setSending(true);

    const { error } = await supabase.from('service_requests').insert({
      hotel_id: store.hotelId,
      room_id: store.roomId,
      service_id: service.id,
      note: note.trim() || null,
      status: 'pending',
    });

    setSending(false);
    if (!error) {
      setSent(true);
      setNote('');
      setTimeout(() => { setSent(false); onClose(); }, 2000);
    }
  };

  if (!service) return null;

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
            className="glass-card w-[450px] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon || '🛎'}</span>
                <h2 className="text-white text-xl font-semibold">Request {service.name}</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white text-2xl transition-colors service-focusable" tabIndex={0}>✕</button>
            </div>

            {sent ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-white text-xl font-semibold">Request Sent!</p>
                <p className="text-white/60 mt-2">The front office has been notified.</p>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-white/60 text-sm mb-4">
                  Room {store.roomCode} — {store.guestName || 'Guest'}
                </p>
                <div>
                  <label className="block text-white/50 text-sm mb-1">Additional note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Please bring extra towels"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-teal-400 focus:outline-none resize-none service-focusable"
                    tabIndex={0}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all service-focusable disabled:opacity-50"
                  style={{ background: 'var(--color-teal)' }}
                  tabIndex={0}
                >
                  {sending ? 'Sending...' : `Request ${service.name}`}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
