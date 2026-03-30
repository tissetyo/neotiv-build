'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name: string | null; email: string | null; role: string; is_active: boolean; hotel_id: string }[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const [staffRes, hotelRes] = await Promise.all([
      supabase.from('staff').select('*').order('created_at'),
      supabase.from('hotels').select('id, name'),
    ]);
    setAccounts(staffRes.data || []);
    setHotels(hotelRes.data || []);
  };

  const getHotelName = (id: string) => hotels.find(h => h.id === id)?.name || '-';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Account Management</h1>
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Hotel</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {accounts.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400">No accounts</td></tr>}
            {accounts.map(a => (
              <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium">{a.name || '-'}</td>
                <td className="px-4 py-3">{a.email || '-'}</td>
                <td className="px-4 py-3 capitalize">{a.role}</td>
                <td className="px-4 py-3">{getHotelName(a.hotel_id)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.is_active ? 'Active' : 'Suspended'}
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
