'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import type { Notification } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: Props) {
  const store = useRoomStore();
  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.notif-focusable' });

  const { data: notifications } = useSWR(
    isOpen && store.hotelId && store.roomId ? `/api/room/${store.roomId}/notifications` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('hotel_id', store.hotelId as string)
        .or(`room_id.eq.${store.roomId},room_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as Notification[]) || [];
    }
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-[4vw]"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-[800px] h-[80vh] flex flex-col rounded-3xl overflow-hidden glass-card"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🔔</span>
                <h2 className="text-white text-2xl font-semibold">Notifications History</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white text-2xl notif-focusable" tabIndex={0}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!notifications ? (
                <div className="text-white/50 text-center py-10">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/50">
                  <span className="text-5xl mb-4">📭</span>
                  <p>No recent notifications.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button key={n.id} className="w-full text-left p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors notif-focusable" tabIndex={0}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">{n.title}</h3>
                      <span className="text-white/40 text-sm">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {n.body && <p className="text-white/70">{n.body}</p>}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
