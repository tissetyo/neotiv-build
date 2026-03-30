'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function StaffPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [staff, setStaff] = useState<{ id: string; name: string | null; email: string | null; role: string; is_active: boolean }[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('frontoffice');
  const [inviting, setInviting] = useState(false);

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    const { data } = await supabase.from('staff').select('*').eq('hotel_id', hotel.id).order('created_at');
    setStaff(data || []);
  };

  const inviteStaff = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/hotel/${hotelSlug}/invite-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
      if (res.ok) {
        setEmail(''); setName(''); setShowInvite(false);
        loadStaff();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to invite');
      }
    } catch { alert('Error'); }
    setInviting(false);
  };

  return (
    <div style={{ fontFamily: 'var(--font-staff)' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
        <button onClick={() => setShowInvite(!showInvite)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
          {showInvite ? 'Cancel' : '+ Invite Staff'}
        </button>
      </div>

      {showInvite && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm text-slate-600 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }}>
                <option value="frontoffice">Front Office</option>
                <option value="manager">Manager</option>
              </select></div>
          </div>
          <button onClick={inviteStaff} disabled={inviting} className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
            {inviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {staff.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-400">No staff members</td></tr>}
            {staff.map(s => (
              <tr key={s.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium">{s.name || '-'}</td>
                <td className="px-4 py-3">{s.email || '-'}</td>
                <td className="px-4 py-3 capitalize">{s.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
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
