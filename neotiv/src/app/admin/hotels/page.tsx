'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Hotel } from '@/types';
import Link from 'next/link';

interface CreatedHotel {
  hotel: Hotel;
  managerEmail?: string;
  slug: string;
}

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<(Hotel & { roomCount?: number })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedHotel | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    setHotels(data || []);
  };

  const createHotel = async () => {
    if (!name.trim() || !slug.trim()) { setError('Hotel name and slug are required'); return; }
    setSaving(true);
    setError('');

    const supabase = createBrowserClient();

    // 1. Create hotel
    const { data, error: hotelError } = await supabase.from('hotels').insert({ name, slug, location, timezone }).select().single();
    if (hotelError) { setError(hotelError.message); setSaving(false); return; }

    // 2. Seed default services
    if (data) {
      const defaults = [
        { hotel_id: data.id, name: 'Room Service', icon: '🍽️', sort_order: 0 },
        { hotel_id: data.id, name: 'Laundry', icon: '👕', sort_order: 1 },
        { hotel_id: data.id, name: 'Spa', icon: '💆', sort_order: 2 },
        { hotel_id: data.id, name: 'Car Rental', icon: '🚗', sort_order: 3 },
        { hotel_id: data.id, name: 'Restaurant', icon: '🍴', sort_order: 4 },
      ];
      await supabase.from('services').insert(defaults);
    }

    // 3. Create manager account if email provided
    if (managerEmail.trim() && managerPassword.trim() && managerName.trim()) {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: managerEmail.trim(),
          password: managerPassword.trim(),
          name: managerName.trim(),
          role: 'manager',
          hotel_id: data.id,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(`Hotel created but manager account failed: ${result.error}`);
      }
    }

    // 4. Show success card
    setCreated({
      hotel: data,
      managerEmail: managerEmail.trim() || undefined,
      slug,
    });

    // Reset form
    setName(''); setSlug(''); setLocation(''); setManagerName(''); setManagerEmail(''); setManagerPassword('');
    setShowForm(false);
    loadHotels();
    setSaving(false);
  };

  const toggleActive = async (hotel: Hotel) => {
    const supabase = createBrowserClient();
    await supabase.from('hotels').update({ is_active: !hotel.is_active }).eq('id', hotel.id);
    setHotels(hotels.map(h => h.id === hotel.id ? { ...h, is_active: !h.is_active } : h));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Hotels</h1>
        <button onClick={() => { setShowForm(!showForm); setCreated(null); setError(''); }} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600">
          {showForm ? 'Cancel' : '+ Create Hotel'}
        </button>
      </div>

      {/* Success Card */}
      {created && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">✅ Hotel Created Successfully!</h3>
              <p className="text-green-700 text-sm">{created.hotel.name} is now ready.</p>
            </div>
            <button onClick={() => setCreated(null)} className="text-green-400 hover:text-green-600 text-xl">✕</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Staff Login Link */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Staff Login URL</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-slate-800 flex-1 truncate">{baseUrl}/{created.slug}/login</code>
                <button onClick={() => copyToClipboard(`${baseUrl}/${created.slug}/login`, 'login')}
                  className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap">
                  {copied === 'login' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Dashboard Link */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Front Office Panel</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-slate-800 flex-1 truncate">{baseUrl}/{created.slug}/frontoffice</code>
                <button onClick={() => copyToClipboard(`${baseUrl}/${created.slug}/frontoffice`, 'fo')}
                  className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap">
                  {copied === 'fo' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* TV Demo Link */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">TV Dashboard Demo</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-slate-800 flex-1 truncate">{baseUrl}/{created.slug}/dashboard/101</code>
                <button onClick={() => copyToClipboard(`${baseUrl}/${created.slug}/dashboard/101`, 'tv')}
                  className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap">
                  {copied === 'tv' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Manager Credentials */}
            {created.managerEmail && (
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Manager Account</p>
                <p className="text-sm text-slate-800">📧 {created.managerEmail}</p>
                <p className="text-xs text-slate-500 mt-1">Can login immediately with the password you set.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-slate-700 mb-4">New Hotel</h3>

          {/* Hotel Info */}
          <p className="text-xs text-slate-400 uppercase font-medium mb-2">Hotel Information</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><label className="block text-sm text-slate-600 mb-1">Hotel Name *</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} placeholder="e.g. The Grand Bali" /></div>
            <div><label className="block text-sm text-slate-600 mb-1">URL Slug *</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
              <p className="text-xs text-slate-400 mt-1">/{slug}/dashboard/room</p></div>
            <div><label className="block text-sm text-slate-600 mb-1">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} placeholder="e.g. Kuta, Bali" /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Timezone</label>
              <input type="text" value={timezone} onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
          </div>

          {/* Manager Account (Optional) */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs text-slate-400 uppercase font-medium mb-2">Manager Account <span className="normal-case text-slate-300">(optional — can add later from Accounts)</span></p>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-slate-600 mb-1">Manager Name</label>
                <input type="text" value={managerName} onChange={e => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} placeholder="e.g. John Doe" /></div>
              <div><label className="block text-sm text-slate-600 mb-1">Manager Email</label>
                <input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} placeholder="manager@hotel.com" /></div>
              <div><label className="block text-sm text-slate-600 mb-1">Initial Password</label>
                <input type="text" value={managerPassword} onChange={e => setManagerPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} placeholder="min. 6 characters" /></div>
            </div>
          </div>

          <button onClick={createHotel} disabled={saving} className="mt-6 px-6 py-2.5 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Hotel'}
          </button>
        </div>
      )}

      {/* Hotels Table */}
      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Slug</th>
            <th className="text-left px-4 py-3 font-medium">Location</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Created</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {hotels.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hotels yet</td></tr>}
            {hotels.map(h => (
              <tr key={h.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link href={`/admin/hotels/${h.id}`} className="hover:text-rose-600 transition-colors">{h.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-500">/{h.slug}</td>
                <td className="px-4 py-3">{h.location || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {h.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(h.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={`/${h.slug}/frontoffice`} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-md font-medium text-white bg-teal-500 hover:bg-teal-600 transition-colors">
                      Manage →
                    </a>
                    <button onClick={() => toggleActive(h)} className="text-xs text-slate-500 hover:text-slate-700">
                      {h.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
