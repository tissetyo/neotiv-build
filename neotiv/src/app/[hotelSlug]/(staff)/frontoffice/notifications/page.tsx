'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Notification } from '@/types';

export default function NotificationsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRoom, setTargetRoom] = useState('all');
  const [rooms, setRooms] = useState<{ id: string; room_code: string }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;

    const [notifRes, roomRes] = await Promise.all([
      supabase.from('notifications').select('*').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('rooms').select('id, room_code').eq('hotel_id', hotel.id).order('room_code'),
    ]);

    setNotifications(notifRes.data || []);
    setRooms(roomRes.data || []);
  };

  const sendNotification = async () => {
    if (!title.trim()) return;
    setSending(true);

    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) { setSending(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user?.id || '').single();

    await supabase.from('notifications').insert({
      hotel_id: hotel.id,
      room_id: targetRoom === 'all' ? null : targetRoom,
      title,
      body,
      created_by: staff?.id || null,
    });

    setTitle('');
    setBody('');
    await loadData();
    setSending(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Notifications</h1>

      {/* Compose */}
      <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Send Notification</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">To</label>
            <select value={targetRoom} onChange={e => setTargetRoom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="all">All Rooms (Broadcast)</option>
              {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder="Notification title..."
              className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm text-slate-600 mb-1">Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={300} rows={3} placeholder="Message body..."
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <button onClick={sendNotification} disabled={sending || !title.trim()}
          className="mt-3 px-6 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--color-teal)' }}>
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      {/* History */}
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Room</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Body</th>
              <th className="text-left px-4 py-3 font-medium">Sent At</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No notifications yet</td></tr>
            ) : notifications.map(n => (
              <tr key={n.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3">{n.room_id ? rooms.find(r => r.id === n.room_id)?.room_code || 'Room' : 'All'}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{n.title}</td>
                <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{n.body}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(n.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${n.is_read ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {n.is_read ? 'Read' : 'Unread'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
