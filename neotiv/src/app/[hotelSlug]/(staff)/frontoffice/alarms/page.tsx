'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Alarm } from '@/types';

export default function AlarmsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_code: string; guest_name: string | null }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;

    const [alarmRes, roomRes] = await Promise.all([
      supabase.from('alarms').select('*').eq('hotel_id', hotel.id).order('scheduled_time', { ascending: true }),
      supabase.from('rooms').select('id, room_code, guest_name').eq('hotel_id', hotel.id),
    ]);
    setAlarms(alarmRes.data || []);
    setRooms(roomRes.data || []);
  };

  const acknowledge = async (alarmId: string) => {
    const supabase = createBrowserClient();
    await supabase.from('alarms').update({ is_acknowledged: true }).eq('id', alarmId);
    setAlarms(alarms.map(a => a.id === alarmId ? { ...a, is_acknowledged: true } : a));
  };

  const getRoom = (roomId: string) => rooms.find(r => r.id === roomId);
  const isUpcoming = (time: string) => {
    const diff = new Date(time).getTime() - Date.now();
    return diff > 0 && diff < 30 * 60 * 1000;
  };

  const pending = alarms.filter(a => !a.is_acknowledged);
  const done = alarms.filter(a => a.is_acknowledged);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Alarm Manager</h1>
      <div className="bg-white border rounded-xl overflow-hidden mb-6" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Room</th>
              <th className="text-left px-4 py-3 font-medium">Guest</th>
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Note</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No pending alarms</td></tr>
            )}
            {pending.map(a => {
              const room = getRoom(a.room_id);
              return (
                <tr key={a.id} className={`border-t ${isUpcoming(a.scheduled_time) ? 'bg-amber-50' : ''}`} style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium">{room?.room_code || '-'}</td>
                  <td className="px-4 py-3">{room?.guest_name || '-'}</td>
                  <td className="px-4 py-3">{new Date(a.scheduled_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{a.note || '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pending</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => acknowledge(a.id)} className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg font-semibold hover:bg-green-600">Mark as Called</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {done.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <div className="px-4 py-3 bg-slate-50 font-semibold text-sm text-slate-500">Acknowledged</div>
          <table className="w-full text-sm">
            <tbody>
              {done.map(a => {
                const room = getRoom(a.room_id);
                return (
                  <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3">{room?.room_code || '-'}</td>
                    <td className="px-4 py-3">{room?.guest_name || '-'}</td>
                    <td className="px-4 py-3">{new Date(a.scheduled_time).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{a.note || '-'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Done</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
