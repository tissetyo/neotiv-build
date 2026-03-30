'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AnalyticsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [stats, setStats] = useState({ total: 0, occupied: 0, pendingReqs: 0, unreadChats: 0 });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;

    const [roomsRes, reqsRes, chatsRes] = await Promise.all([
      supabase.from('rooms').select('id, is_occupied').eq('hotel_id', hotel.id),
      supabase.from('service_requests').select('id').eq('hotel_id', hotel.id).eq('status', 'pending'),
      supabase.from('chat_messages').select('id').eq('hotel_id', hotel.id).eq('is_read', false).eq('sender_role', 'guest'),
    ]);

    const rooms = roomsRes.data || [];
    setStats({
      total: rooms.length,
      occupied: rooms.filter(r => r.is_occupied).length,
      pendingReqs: reqsRes.data?.length || 0,
      unreadChats: chatsRes.data?.length || 0,
    });
  };

  const occupancyPct = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  const cards = [
    { label: 'Occupancy', value: `${occupancyPct}%`, sub: `${stats.occupied}/${stats.total} rooms`, color: '#14b8a6' },
    { label: 'Active Rooms', value: stats.occupied.toString(), sub: `of ${stats.total} total`, color: '#3b82f6' },
    { label: 'Pending Requests', value: stats.pendingReqs.toString(), sub: 'awaiting action', color: '#f59e0b' },
    { label: 'Unread Chats', value: stats.unreadChats.toString(), sub: 'guest messages', color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-staff)' }}>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Occupancy Overview</h2>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div className="h-4 rounded-full transition-all" style={{ width: `${occupancyPct}%`, background: 'var(--color-teal)' }} />
        </div>
        <p className="text-sm text-slate-500 mt-2">{occupancyPct}% occupancy rate</p>
      </div>
    </div>
  );
}
