'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ServiceRequest } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function ServiceRequestsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    const { data } = await supabase.from('service_requests')
      .select('*, services(name, icon), rooms(room_code)')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    const supabase = createBrowserClient();
    await supabase.from('service_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setRequests(requests.map(r => r.id === id ? { ...r, status: status as ServiceRequest['status'] } : r));
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Service Requests</h1>
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'in_progress', 'done', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${filter === f ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
            style={filter !== f ? { borderColor: 'var(--color-border)' } : {}}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Room</th>
              <th className="text-left px-4 py-3 font-medium">Service</th>
              <th className="text-left px-4 py-3 font-medium">Note</th>
              <th className="text-left px-4 py-3 font-medium">Requested</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No service requests</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium">{r.rooms?.room_code || '-'}</td>
                <td className="px-4 py-3">{r.services?.icon} {r.services?.name || 'Service'}</td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.note || '-'}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[r.status]}`}>{r.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                    className="px-2 py-1 border rounded text-xs" style={{ borderColor: 'var(--color-border)' }}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
