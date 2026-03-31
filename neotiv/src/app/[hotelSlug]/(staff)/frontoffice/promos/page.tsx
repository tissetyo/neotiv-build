'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Promo } from '@/types';

export default function PromosPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPromos(); }, []);

  const loadPromos = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    const { data } = await supabase.from('promos').select('*').eq('hotel_id', hotel.id).order('created_at', { ascending: false });
    setPromos(data || []);
  };

  const savePromo = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) { setSaving(false); return; }
    await supabase.from('promos').insert({
      hotel_id: hotel.id, title, description,
      valid_from: validFrom || null, valid_until: validUntil || null,
    });
    setTitle(''); setDescription(''); setValidFrom(''); setValidUntil('');
    setShowForm(false);
    await loadPromos();
    setSaving(false);
  };

  const toggleActive = async (promo: Promo) => {
    const supabase = createBrowserClient();
    await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id);
    setPromos(promos.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
  };

  const deletePromo = async (id: string) => {
    if (!confirm('Delete this promo?')) return;
    const supabase = createBrowserClient();
    await supabase.from('promos').delete().eq('id', id);
    setPromos(promos.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Promos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
          {showForm ? 'Cancel' : '+ Add Promo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-600 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm text-slate-600 mb-1">Valid From</label>
                <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
              <div><label className="block text-sm text-slate-600 mb-1">Valid Until</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            </div>
          </div>
          <div className="mt-3"><label className="block text-sm text-slate-600 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: 'var(--color-border)' }} /></div>
          <button onClick={savePromo} disabled={saving} className="mt-3 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
            {saving ? 'Saving...' : 'Save Promo'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {promos.length === 0 && <p className="col-span-3 text-center py-10 text-slate-400">No promos yet</p>}
        {promos.map(p => (
          <div key={p.id} className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            {p.poster_url && <img src={p.poster_url} alt={p.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{p.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {p.description && <p className="text-sm text-slate-500 mb-3">{p.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p)} className="text-xs text-slate-500 hover:text-slate-700">{p.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => deletePromo(p.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
