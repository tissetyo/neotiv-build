'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRoomStore } from '@/stores/roomStore';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';

interface ChatMessage {
  id: string;
  sender_role: 'guest' | 'frontoffice';
  sender_name: string | null;
  message: string;
  created_at: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const store = useRoomStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();

  // Load chat history
  useEffect(() => {
    if (!isOpen || !store.roomId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', store.roomId!)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) setMessages(data as ChatMessage[]);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${store.roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${store.roomId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, store.roomId, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useDpadNavigation({ enabled: isOpen, onEscape: onClose, selector: '.chat-focusable' });

  const handleSend = async () => {
    if (!input.trim() || !store.roomId || !store.hotelId) return;
    setSending(true);

    const { error } = await supabase.from('chat_messages').insert({
      hotel_id: store.hotelId,
      room_id: store.roomId,
      sender_role: 'guest',
      sender_name: store.guestName || 'Guest',
      message: input.trim(),
    });

    if (!error) {
      setInput('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
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
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-[700px] h-[600px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <h2 className="text-white text-xl font-semibold">Chat with Front Office</h2>
                {store.unreadChatCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {store.unreadChatCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white text-2xl transition-colors chat-focusable"
                tabIndex={0}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-white/40">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === 'guest' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_role === 'guest'
                        ? 'bg-teal-600/80 text-white rounded-br-md'
                        : 'bg-white/10 text-white/90 rounded-bl-md'
                    }`}
                  >
                    <p className="text-xs opacity-60 mb-1">
                      {msg.sender_name || msg.sender_role} • {formatTime(msg.created_at)}
                    </p>
                    <p className="text-[15px] leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-teal-400 focus:outline-none chat-focusable"
                tabIndex={0}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all chat-focusable disabled:opacity-40"
                style={{ background: 'var(--color-teal)' }}
                tabIndex={0}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
