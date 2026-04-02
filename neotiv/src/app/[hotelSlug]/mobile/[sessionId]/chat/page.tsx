'use client';

import { useState, useRef, useEffect, use } from 'react';
import useSWR from 'swr';
import { Send } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types';

export default function MobileChatPage({ params }: { params: Promise<{ hotelSlug: string; sessionId: string }> }) {
  const { sessionId } = use(params);
  const [sessionData, setSessionData] = useState<any>(null);
  const [newMsg, setNewMsg] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);

  // 1. Initial Load for Auth context
  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('mobile_sessions').select('*, rooms(room_code)').eq('id', sessionId).single();
      setSessionData(data);
    }
    load();
  }, [sessionId]);

  const hotelId = sessionData?.hotel_id;
  const roomId = sessionData?.room_id;
  const roomCode = sessionData?.rooms?.room_code;

  // 2. Poll Messages
  const { data: messages = [], mutate } = useSWR(
    hotelId && roomId ? `/api/room/${roomId}/chat?hotelId=${hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('chat_messages').select('*')
        .eq('room_id', roomId!).order('created_at', { ascending: true }).limit(50);
      
      // Mark staff messages as read silently
      supabase.from('chat_messages').update({ is_read: true })
        .eq('room_id', roomId!).eq('sender_role', 'frontoffice').eq('is_read', false).then();
        
      return data as ChatMessage[] || [];
    },
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !hotelId || !roomId) return;
    
    const msgText = newMsg;
    setNewMsg(''); // Clear input
    
    // Optimistic UI push
    mutate([...messages, {
      id: crypto.randomUUID(),
      hotel_id: hotelId,
      room_id: roomId,
      sender_role: 'guest',
      sender_name: `Room ${roomCode}`,
      message: msgText,
      created_at: new Date().toISOString()
    } as any], false);
    
    const supabase = createBrowserClient();
    await supabase.from('chat_messages').insert({
      hotel_id: hotelId,
      room_id: roomId,
      sender_role: 'guest',
      sender_name: `Room ${roomCode}`,
      message: msgText,
    });
    
    mutate();
  };

  if (!sessionData) return <div className="p-8 text-center text-slate-400">Loading connection...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-slate-50 relative">
      <div className="bg-teal-600 px-5 py-4 text-white shadow-sm shrink-0">
        <h1 className="text-lg font-bold">Front Desk Chat</h1>
        <p className="text-teal-100 text-xs">Usually replies in a few minutes.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: any) => {
          const isGuest = m.sender_role === 'guest';
          return (
            <div key={m.id} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
              {!isGuest && (
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold mr-2 mt-auto shrink-0 border border-teal-200">
                  FD
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-2.5 shadow-sm text-sm ${
                isGuest 
                  ? 'bg-slate-800 text-white rounded-2xl rounded-br-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm whitespace-pre-wrap'
              }`}>
                {m.message}
                <div className={`text-[9px] mt-1.5 ${isGuest ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom,16px)] shrink-0 flex items-center gap-2">
        <input 
          type="text" 
          value={newMsg} 
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..." 
          className="flex-1 bg-slate-100 px-4 py-2.5 rounded-full text-sm border-none focus:ring-2 focus:ring-teal-500 outline-none" 
        />
        <button 
          onClick={sendMessage} 
          disabled={!newMsg.trim()}
          className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white disabled:opacity-50 active:scale-95 transition-transform shrink-0"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
