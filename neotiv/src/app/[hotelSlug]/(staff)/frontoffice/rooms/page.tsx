'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Room } from '@/types';

export default function RoomsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) { setLoading(false); return; }

    const { data } = await supabase
      .from('rooms')
      .select('*, room_types(name)')
      .eq('hotel_id', hotel.id)
      .order('room_code');

    setRooms(data || []);
    setLoading(false);
  };

  const toggleOccupancy = async (room: Room) => {
    const supabase = createBrowserClient();
    await supabase.from('rooms').update({ is_occupied: !room.is_occupied }).eq('id', room.id);
    setRooms(rooms.map(r => r.id === room.id ? { ...r, is_occupied: !r.is_occupied } : r));
  };

  const filtered = rooms.filter(r => {
    if (filter === 'occupied' && !r.is_occupied) return false;
    if (filter === 'vacant' && r.is_occupied) return false;
    if (search && !r.room_code.includes(search) && !r.guest_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Room Overview</h1>
        <div className="flex items-center gap-3">
          <input type="text" placeholder="Search room or guest..." value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:border-teal-500" style={{ borderColor: 'var(--color-border)' }} />
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            {(['all', 'occupied', 'vacant'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm capitalize ${filter === f ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-2">🏨</p>
          <p>No rooms found. {rooms.length === 0 ? 'Connect Supabase to load rooms.' : 'Try adjusting filters.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-slate-800">Room {room.room_code}</span>
                <button onClick={() => toggleOccupancy(room)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${room.is_occupied ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  {room.is_occupied ? 'Occupied' : 'Vacant'}
                </button>
              </div>
              <p className="text-sm text-slate-500">{room.room_types?.name || 'Standard'}</p>
              {room.is_occupied && room.guest_name && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm font-medium text-slate-700">{room.guest_name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {room.checkin_date && `${room.checkin_date} → ${room.checkout_date || 'TBD'}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
