'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface StaffAccount {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  hotel_id: string;
  user_id: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'frontoffice'>('frontoffice');
  const [formHotelId, setFormHotelId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createBrowserClient();
    const [staffRes, hotelRes] = await Promise.all([
      supabase.from('staff').select('*').order('created_at', { ascending: false }),
      supabase.from('hotels').select('id, name, slug'),
    ]);
    setAccounts(staffRes.data || []);
    setHotels(hotelRes.data || []);
    if (hotelRes.data?.length && !formHotelId) {
      setFormHotelId(hotelRes.data[0].id);
    }
    setLoading(false);
  };

  const getHotelName = (id: string) => hotels.find(h => h.id === id)?.name || '—';

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formHotelId) {
      setError('All fields are required');
      return;
    }
    if (formPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail.trim(),
          password: formPassword.trim(),
          name: formName.trim(),
          role: formRole,
          hotel_id: formHotelId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create account');
        setSaving(false);
        return;
      }

      const hotelName = getHotelName(formHotelId);
      setSuccess(`Account created! ${formName} can now login at the ${hotelName} portal with email: ${formEmail}`);
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('frontoffice');
      setShowForm(false);
      loadData();
    } catch {
      setError('Network error. Please try again.');
    }

    setSaving(false);
  };

  const toggleSuspend = async (account: StaffAccount) => {
    const newStatus = !account.is_active;
    const action = newStatus ? 'reactivate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} ${account.name || account.email}?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${account.user_id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: !newStatus }),
      });

      if (res.ok) {
        setAccounts(accounts.map(a => a.id === account.id ? { ...a, is_active: newStatus } : a));
      }
    } catch {
      alert('Failed to update account status');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Account Management</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600"
        >
          {showForm ? 'Cancel' : '+ Create Account'}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 text-sm flex items-start justify-between">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600 ml-2">✕</button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create Account Form */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-slate-700 mb-4">New Staff Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Full Name *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email *</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                placeholder="staff@hotel.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Password *</label>
              <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                placeholder="min. 6 characters"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
              <p className="text-xs text-slate-400 mt-1">Share this password with the staff member</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Assign to Hotel *</label>
              <select value={formHotelId} onChange={e => setFormHotelId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none bg-white" style={{ borderColor: 'var(--color-border)' }}>
                {hotels.length === 0 && <option value="">No hotels — create one first</option>}
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Role *</label>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setFormRole('frontoffice')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${formRole === 'frontoffice' ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-white text-slate-500'}`}
                  style={formRole !== 'frontoffice' ? { borderColor: 'var(--color-border)' } : {}}>
                  🏠 Front Office
                </button>
                <button
                  onClick={() => setFormRole('manager')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${formRole === 'manager' ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white text-slate-500'}`}
                  style={formRole !== 'manager' ? { borderColor: 'var(--color-border)' } : {}}>
                  👔 Manager
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {formRole === 'manager' ? 'Managers can access Settings, Room Types, Staff, and Analytics.' : 'Front Office staff can manage rooms, chat, alarms, and service requests.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreate} disabled={saving || hotels.length === 0}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-slate-600 text-sm bg-slate-100 hover:bg-slate-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Hotel</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No accounts yet. Create one above.</td></tr>
            ) : accounts.map(a => (
              <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium text-slate-800">{a.name || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{a.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    a.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-3">{getHotelName(a.hotel_id)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSuspend(a)}
                    className={`text-xs font-medium ${a.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                    {a.is_active ? 'Suspend' : 'Reactivate'}
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
