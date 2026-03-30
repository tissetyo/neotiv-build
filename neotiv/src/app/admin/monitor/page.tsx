'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminMonitorPage() {
  const [stats, setStats] = useState({ hotels: 0, rooms: 0, occupied: 0, staff: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const supabase = createBrowserClient();
    const [hotelsRes, roomsRes, staffRes] = await Promise.all([
      supabase.from('hotels').select('id', { count: 'exact' }),
      supabase.from('rooms').select('id, is_occupied'),
      supabase.from('staff').select('id', { count: 'exact' }).eq('is_active', true),
    ]);
    const rooms = roomsRes.data || [];
    setStats({
      hotels: hotelsRes.count || 0,
      rooms: rooms.length,
      occupied: rooms.filter((r: { is_occupied: boolean }) => r.is_occupied).length,
      staff: staffRes.count || 0,
    });
  };

  const cards = [
    { label: 'Total Hotels', value: stats.hotels, color: '#f43f5e' },
    { label: 'Total Rooms', value: stats.rooms, color: '#3b82f6' },
    { label: 'Occupied Now', value: stats.occupied, color: '#14b8a6' },
    { label: 'Active Staff', value: stats.staff, color: '#f59e0b' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Usage Monitor</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Escalation Alerts</h2>
        {stats.rooms > 500 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-2">
            ⚠️ 500+ rooms detected. Consider enabling Supabase read replicas.
          </div>
        )}
        {stats.rooms <= 500 && (
          <p className="text-sm text-slate-400">✅ All systems nominal. No escalation alerts.</p>
        )}
      </div>
    </div>
  );
}
