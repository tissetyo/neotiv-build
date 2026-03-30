'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Room } from '@/types';

export default function RoomManagementPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState('');
  const [formPin, setFormPin] = useState('');
  const [hotelId, setHotelId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    setHotelId(hotel.id);
    const [roomRes, typeRes] = await Promise.all([
      supabase.from('rooms').select('*, room_types(name)').eq('hotel_id', hotel.id).order('room_code'),
      supabase.from('room_types').select('id, name').eq('hotel_id', hotel.id),
    ]);
    setRooms(roomRes.data || []);
    setRoomTypes(typeRes.data || []);
  };

  const addRoom = async () => {
    if (!formCode.trim()) return;
    const supabase = createBrowserClient();
    await supabase.from('rooms').insert({
      hotel_id: hotelId, room_code: formCode,
      room_type_id: formType || null, pin: formPin || '0000',
    });
    setFormCode(''); setFormType(''); setFormPin(''); setShowForm(false);
    loadData();
  };

  const deleteRoom = async (id: string, code: string) => {
    if (!confirm(`Delete Room ${code}? This is permanent.`)) return;
    const supabase = createBrowserClient();
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(rooms.filter(r => r.id !== id));
  };

  const genPin = () => setFormPin(String(Math.floor(1000 + Math.random() * 9000)));

  return (
    <div style={{ fontFamily: 'var(--font-staff)' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Room Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
          {showForm ? 'Cancel' : '+ Add Room'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm text-slate-600 mb-1">Room Code</label>
              <input type="text" value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="e.g. 417" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Room Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }}>
                <option value="">Select type</option>
                {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></div>
            <div><label className="block text-sm text-slate-600 mb-1">PIN</label>
              <div className="flex gap-2">
                <input type="text" value={formPin} onChange={e => setFormPin(e.target.value)} maxLength={4} placeholder="4 digits" className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
                <button onClick={genPin} className="px-3 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50" style={{ borderColor: 'var(--color-border)' }}>Auto</button>
              </div></div>
          </div>
          <button onClick={addRoom} className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>Save Room</button>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Room Code</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Guest</th>
            <th className="text-left px-4 py-3 font-medium">Check-in</th>
            <th className="text-left px-4 py-3 font-medium">Check-out</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {rooms.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No rooms. Add one above or connect Supabase.</td></tr>}
            {rooms.map(r => (
              <tr key={r.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium">{r.room_code}</td>
                <td className="px-4 py-3">{r.room_types?.name || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.is_occupied ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{r.is_occupied ? 'Occupied' : 'Vacant'}</span></td>
                <td className="px-4 py-3">{r.guest_name || '-'}</td>
                <td className="px-4 py-3 text-slate-400">{r.checkin_date || '-'}</td>
                <td className="px-4 py-3 text-slate-400">{r.checkout_date || '-'}</td>
                <td className="px-4 py-3"><button onClick={() => deleteRoom(r.id, r.room_code)} className="text-xs text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
