'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<{ id: string; text: string; hotel_id: string | null; is_active: boolean; created_at: string }[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [text, setText] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [hotelId, setHotelId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const [annRes, hotelRes] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('hotels').select('id, name'),
    ]);
    setAnnouncements(annRes.data || []);
    setHotels(hotelRes.data || []);
  };

  const broadcast = async () => {
    if (!text.trim()) return;
    const supabase = createBrowserClient();
    await supabase.from('announcements').insert({
      text,
      hotel_id: target === 'all' ? null : hotelId || null,
    });
    setText('');
    loadData();
  };

  const toggle = async (id: string, active: boolean) => {
    const supabase = createBrowserClient();
    await supabase.from('announcements').update({ is_active: !active }).eq('id', id);
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_active: !active } : a));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Global Announcements</h1>
      <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={target === 'all'} onChange={() => setTarget('all')} /> All Hotels</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={target === 'specific'} onChange={() => setTarget('specific')} /> Specific Hotel</label>
          {target === 'specific' && (
            <select value={hotelId} onChange={e => setHotelId(e.target.value)} className="px-3 py-1 border rounded text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">Select hotel</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Marquee announcement text..."
          className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-3" style={{ borderColor: 'var(--color-border)' }} />
        <button onClick={broadcast} className="px-6 py-2 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600">Broadcast</button>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Text</th>
            <th className="text-left px-4 py-3 font-medium">Target</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {announcements.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-400">No announcements</td></tr>}
            {announcements.map(a => (
              <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 max-w-[400px] truncate">{a.text}</td>
                <td className="px-4 py-3">{a.hotel_id ? hotels.find(h => h.id === a.hotel_id)?.name || 'Hotel' : 'All Hotels'}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(a.id, a.is_active)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
