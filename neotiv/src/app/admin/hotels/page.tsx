'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Hotel } from '@/types';

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<(Hotel & { roomCount?: number })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    setHotels(data || []);
  };

  const createHotel = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { data, error } = await supabase.from('hotels').insert({ name, slug, location, timezone }).select().single();
    if (error) { alert(error.message); setSaving(false); return; }
    // Seed default services
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
    setName(''); setSlug(''); setLocation(''); setShowForm(false);
    loadHotels();
    setSaving(false);
  };

  const toggleActive = async (hotel: Hotel) => {
    const supabase = createBrowserClient();
    await supabase.from('hotels').update({ is_active: !hotel.is_active }).eq('id', hotel.id);
    setHotels(hotels.map(h => h.id === hotel.id ? { ...h, is_active: !h.is_active } : h));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Hotels</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600">
          {showForm ? 'Cancel' : '+ Create Hotel'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-600 mb-1">Hotel Name</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">URL Slug</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
              <p className="text-xs text-slate-400 mt-1">neotiv.com/{slug}/dashboard/room</p></div>
            <div><label className="block text-sm text-slate-600 mb-1">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Timezone</label>
              <input type="text" value={timezone} onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
          </div>
          <button onClick={createHotel} disabled={saving} className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold bg-rose-500 hover:bg-rose-600">
            {saving ? 'Creating...' : 'Create Hotel'}
          </button>
        </div>
      )}

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
                <td className="px-4 py-3 font-medium text-slate-800">{h.name}</td>
                <td className="px-4 py-3 text-slate-500">/{h.slug}</td>
                <td className="px-4 py-3">{h.location || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {h.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(h.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(h)} className="text-xs text-slate-500 hover:text-slate-700 mr-3">{h.is_active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
