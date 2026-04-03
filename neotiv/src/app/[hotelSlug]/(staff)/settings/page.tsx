'use client';

import { useEffect, useState, use, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Hotel } from '@/types';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function HotelSettingsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [tab, setTab] = useState<'general' | 'wifi' | 'clocks' | 'announcements'>('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Hotel>>({});
  const [announcements, setAnnouncements] = useState<{ id: string; text: string; is_active: boolean }[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Featured image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const featuredImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadHotel(); }, []);

  const loadHotel = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('hotels').select('*').eq('slug', hotelSlug).single();
    if (data) { setHotel(data); setForm(data); }
    const { data: ann } = await supabase.from('announcements').select('*').eq('hotel_id', data?.id).order('created_at');
    setAnnouncements(ann || []);
  };

  const save = async () => {
    if (!hotel) return;
    setSaving(true);
    const supabase = createBrowserClient();
    await supabase.from('hotels').update(form).eq('id', hotel.id);
    setSaving(false);
    alert('Settings saved!');
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.trim() || !hotel) return;
    const supabase = createBrowserClient();
    await supabase.from('announcements').insert({ hotel_id: hotel.id, text: newAnnouncement });
    setNewAnnouncement('');
    loadHotel();
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hotel) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotel.id);
    const res = await fetch('/api/upload/hotel-featured', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, featured_image_url: data.url });
      setHotel({ ...hotel, featured_image_url: data.url });
    }
    setUploadingImage(false);
    if (featuredImgRef.current) featuredImgRef.current.value = '';
  };

  const removeFeaturedImage = async () => {
    if (!hotel) return;
    const supabase = createBrowserClient();
    await supabase.from('hotels').update({ featured_image_url: null }).eq('id', hotel.id);
    setForm({ ...form, featured_image_url: null });
    setHotel({ ...hotel, featured_image_url: null });
  };

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'wifi', label: 'WiFi' },
    { key: 'clocks', label: 'Clock Timezones' },
    { key: 'announcements', label: 'Announcements' },
  ] as const;

  const inputClass = "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-500";

  return (
    <div style={{ fontFamily: 'var(--font-staff)' }}>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Hotel Settings</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
            style={tab !== t.key ? { borderColor: 'var(--color-border)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'var(--color-border)' }}>
        {tab === 'general' && (
          <div className="space-y-4 max-w-xl">
            <div><label className="block text-sm text-slate-600 mb-1">Hotel Name</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Location / City</label>
              <input type="text" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Timezone</label>
              <input type="text" value={form.timezone || ''} onChange={e => setForm({...form, timezone: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Airport IATA Code</label>
              <input type="text" value={form.airport_iata_code || ''} onChange={e => setForm({...form, airport_iata_code: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} placeholder="e.g. DPS" /></div>

            {/* Featured Image */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Featured Image</label>
              <p className="text-xs text-slate-400 mb-3">This image represents your hotel on the TV dashboard and listings.</p>

              {form.featured_image_url ? (
                <div className="relative inline-block group">
                  <img
                    src={form.featured_image_url}
                    alt="Featured"
                    className="w-64 h-40 object-cover rounded-xl border shadow-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <button
                      onClick={() => featuredImgRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 text-slate-700 text-xs font-medium rounded-lg hover:bg-white transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 inline mr-1" />Change
                    </button>
                    <button
                      onClick={removeFeaturedImage}
                      className="px-3 py-1.5 bg-red-500/90 text-white text-xs font-medium rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 inline mr-1" />Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => featuredImgRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {uploadingImage ? (
                    <div className="animate-spin w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingImage ? 'Uploading...' : 'Upload featured image (JPG, PNG, WebP — max 5MB)'}</span>
                </button>
              )}
              <input
                ref={featuredImgRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFeaturedImageUpload}
              />
            </div>

            <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'wifi' && (
          <div className="space-y-4 max-w-xl">
            <div><label className="block text-sm text-slate-600 mb-1">SSID</label>
              <input type="text" value={form.wifi_ssid || ''} onChange={e => setForm({...form, wifi_ssid: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Username</label>
              <input type="text" value={form.wifi_username || ''} onChange={e => setForm({...form, wifi_username: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <div><label className="block text-sm text-slate-600 mb-1">Password</label>
              <input type="text" value={form.wifi_password || ''} onChange={e => setForm({...form, wifi_password: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
            <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'clocks' && (
          <div className="space-y-4 max-w-xl">
            {[1, 2, 3].map(i => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-slate-600 mb-1">Clock {i} Label</label>
                  <input type="text" value={(form as Record<string, unknown>)[`clock_label_${i}`] as string || ''} onChange={e => setForm({...form, [`clock_label_${i}`]: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
                <div><label className="block text-sm text-slate-600 mb-1">Timezone</label>
                  <input type="text" value={(form as Record<string, unknown>)[`clock_timezone_${i}`] as string || ''} onChange={e => setForm({...form, [`clock_timezone_${i}`]: e.target.value})} className={inputClass} style={{ borderColor: 'var(--color-border)' }} /></div>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="max-w-xl">
            <div className="flex gap-2 mb-4">
              <input type="text" value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} placeholder="New announcement text..."
                className={`flex-1 ${inputClass}`} style={{ borderColor: 'var(--color-border)' }} />
              <button onClick={addAnnouncement} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--color-teal)' }}>Add</button>
            </div>
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{a.text}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-slate-400 text-sm">No announcements</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
