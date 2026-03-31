'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types';

export default function ChatPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [rooms, setRooms] = useState<{ id: string; room_code: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [hotelId, setHotelId] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) loadMessages(selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!hotelId) return;
    const supabase = createBrowserClient();
    const channel = supabase.channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `hotel_id=eq.${hotelId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.room_id === selectedRoom) {
            setMessages(prev => [...prev, msg]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId, selectedRoom]);

  const loadRooms = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    setHotelId(hotel.id);
    const { data } = await supabase.from('rooms').select('id, room_code').eq('hotel_id', hotel.id).order('room_code');
    setRooms(data || []);
    if (data?.[0]) setSelectedRoom(data[0].id);
  };

  const loadMessages = async (roomId: string) => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('chat_messages').select('*')
      .eq('room_id', roomId).order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
    // Mark as read
    await supabase.from('chat_messages').update({ is_read: true })
      .eq('room_id', roomId).eq('sender_role', 'guest').eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedRoom || !hotelId) return;
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('chat_messages').insert({
      hotel_id: hotelId, room_id: selectedRoom,
      sender_role: 'frontoffice', sender_name: user?.user_metadata?.name || 'Staff',
      message: newMsg,
    });
    setNewMsg('');
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Room list */}
      <div className="w-[240px] bg-white border rounded-xl overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-semibold text-slate-700">Rooms</p>
        </div>
        {rooms.map(r => (
          <button key={r.id} onClick={() => setSelectedRoom(r.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b transition-colors ${selectedRoom === r.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            style={{ borderColor: 'var(--color-border)' }}>
            Room {r.room_code}
          </button>
        ))}
        {rooms.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">No rooms</p>}
      </div>

      {/* Chat window */}
      <div className="flex-1 bg-white border rounded-xl flex flex-col overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-4 border-b font-semibold text-slate-800" style={{ borderColor: 'var(--color-border)' }}>
          {selectedRoom ? `Room ${rooms.find(r => r.id === selectedRoom)?.room_code || ''}` : 'Select a room'}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_role === 'frontoffice' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[60%] px-4 py-2 rounded-2xl text-sm ${m.sender_role === 'frontoffice' ? 'bg-teal-500 text-white rounded-br-md' : 'bg-white border text-slate-800 rounded-bl-md'}`}
                style={m.sender_role === 'guest' ? { borderColor: 'var(--color-border)' } : {}}>
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 ${m.sender_role === 'frontoffice' ? 'text-teal-100' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>
        <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
          <button onClick={sendMessage} className="px-5 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>Send</button>
        </div>
      </div>
    </div>
  );
}
