'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Service } from '@/types';

export default function ServicesConfigPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍽️');
  const [description, setDescription] = useState('');
  const [hotelId, setHotelId] = useState('');

  const presetIcons = ['🍽️', '🍴', '🚗', '🛵', '💆', '👕', '🧹', '🏊', '📞', '🧴', '🅿️', '✈️'];

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) return;
    setHotelId(hotel.id);
    const { data } = await supabase.from('services').select('*').eq('hotel_id', hotel.id).order('sort_order');
    setServices(data || []);
  };

  const addService = async () => {
    if (!name.trim()) return;
    const supabase = createBrowserClient();
    await supabase.from('services').insert({ hotel_id: hotelId, name, icon, description, sort_order: services.length });
    setName(''); setIcon('🍽️'); setDescription(''); setShowForm(false);
    loadServices();
  };

  const toggleActive = async (s: Service) => {
    const supabase = createBrowserClient();
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    setServices(services.map(sv => sv.id === s.id ? { ...sv, is_active: !sv.is_active } : sv));
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const supabase = createBrowserClient();
    await supabase.from('services').delete().eq('id', id);
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div style={{ fontFamily: 'var(--font-staff)' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Services Configuration</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="mb-3"><label className="block text-sm text-slate-600 mb-1">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {presetIcons.map(e => (
                <button key={e} onClick={() => setIcon(e)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${icon === e ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-slate-50 hover:bg-slate-100'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-600 mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} /></div>
          </div>
          <button onClick={addService} className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>Save</button>
        </div>
      )}

      <div className="space-y-2">
        {services.length === 0 && <p className="text-center py-10 text-slate-400 bg-white border rounded-xl" style={{ borderColor: 'var(--color-border)' }}>No services configured</p>}
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-white border rounded-xl px-5 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-medium text-slate-800">{s.name}</p>
                {s.description && <p className="text-sm text-slate-400">{s.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleActive(s)} className={`px-3 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.is_active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => deleteService(s.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
