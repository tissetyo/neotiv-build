'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export default function TvSettingsPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = use(params);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAppIndex, setActiveAppIndex] = useState<number | null>(null);

  const defaultConfig = {
    theme: { opacityLight: 0.82, opacityDark: 0.60 },
    apps: [
      { id: "netflix", name: "Netflix", url: "com.netflix.ninja", icon: "/apps/netflix.png" },
      { id: "youtube", name: "YouTube", url: "com.google.android.youtube.tv", icon: "/apps/youtube.png" },
      { id: "prime", name: "Prime Video", url: "com.amazon.amazonvideo.livingroom", icon: "/apps/prime.png" },
      { id: "spotify", name: "Spotify", url: "com.spotify.tv.android", icon: "/apps/spotify.png" },
      { id: "disney", name: "Disney+", url: "com.disney.disneyplus", icon: "/apps/disney.png" },
      { id: "hbo", name: "HBO Max", url: "com.hbo.hbonow", icon: "/apps/hbo.png" }
    ],
    layout: {
      analogClocks: { visible: true },
      flightSchedule: { visible: true },
      hotelDeals: { visible: true },
      digitalClock: { visible: true },
      mapWidget: { visible: true },
      appGrid: { visible: true },
      guestCard: { visible: true },
      wifiCard: { visible: true },
      notificationCard: { visible: true },
      hotelService: { visible: true },
      hotelInfo: { visible: true }
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('hotels').select('tv_layout_config').eq('id', hotelId).single();
      if (data && data.tv_layout_config && Object.keys(data.tv_layout_config).length > 0) {
        setConfig({ ...defaultConfig, ...data.tv_layout_config });
      } else {
        setConfig(defaultConfig);
      }
      setLoading(false);
    };
    fetchConfig();
  }, [hotelId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/tv-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('TV settings saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving failed');
    }
    setSaving(false);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeAppIndex === null) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('app_id', config.apps[activeAppIndex].id || `app-${Date.now()}`);

    try {
      const res = await fetch('/api/upload/tv-app-icon', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const newApps = [...config.apps];
        newApps[activeAppIndex].icon = data.url;
        setConfig({ ...config, apps: newApps });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveAppIndex(null);
  };

  if (loading || !config) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/admin/hotels/${hotelId}`)} className="text-slate-400 hover:text-slate-600">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">TV Dashboard Configuration</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* WIDGET VISIBILITY */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Widget Visibility</h2>
          <p className="text-sm text-slate-500 mb-4">Toggle which widgets appear on the TV screen.</p>
          <div className="space-y-3">
            {Object.keys(config.layout).map((key) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.layout[key].visible}
                    onChange={(e) => setConfig({
                      ...config,
                      layout: { ...config.layout, [key]: { ...config.layout[key], visible: e.target.checked } }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* THEME & APPS */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Theme Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Light Widgets Opacity: {config.theme.opacityLight}</label>
                <input type="range" min="0" max="1" step="0.01" value={config.theme.opacityLight}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, opacityLight: parseFloat(e.target.value) } })}
                  className="w-full accent-teal-500" />
                <p className="text-xs text-slate-500 mt-1">Controls the whiteness of Guest, WiFi, and Notification cards.</p>
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dark Widgets Opacity: {config.theme.opacityDark}</label>
                <input type="range" min="0" max="1" step="0.01" value={config.theme.opacityDark}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, opacityDark: parseFloat(e.target.value) } })}
                  className="w-full accent-teal-500" />
                <p className="text-xs text-slate-500 mt-1">Controls the darkness of Clocks, Schedule, and Maps.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">App Launcher Links</h2>
              <button
                onClick={() => setConfig({ ...config, apps: [...config.apps, { id: `app-${Date.now()}`, name: "New App", url: "", icon: "/apps/default.png" }] })}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >+ Add App</button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleIconUpload} />

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {config.apps.map((app: any, idx: number) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                  <button onClick={() => {
                    const newApps = [...config.apps];
                    newApps.splice(idx, 1);
                    setConfig({ ...config, apps: newApps });
                  }} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                  
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden shadow-inner border border-slate-300">
                        <img src={app.icon} alt="Icon" className="w-full h-full object-cover" />
                      </div>
                      <button onClick={() => { setActiveAppIndex(idx); fileInputRef.current?.click(); }}
                        className="text-[10px] font-medium text-slate-600 border border-slate-300 rounded px-2 hover:bg-slate-200">
                        Upload
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <input type="text" value={app.name} placeholder="App Name"
                        onChange={(e) => {
                          const newApps = [...config.apps];
                          newApps[idx].name = e.target.value;
                          setConfig({ ...config, apps: newApps });
                        }}
                        className="w-full text-sm font-bold bg-transparent border-b border-slate-300 focus:border-teal-500 outline-none pb-1" />
                      <input type="text" value={app.url} placeholder="Package / Deep Link URL"
                        onChange={(e) => {
                          const newApps = [...config.apps];
                          newApps[idx].url = e.target.value;
                          setConfig({ ...config, apps: newApps });
                        }}
                        className="w-full text-xs bg-transparent border-b border-slate-300 focus:border-teal-500 outline-none py-1 text-slate-600 font-mono" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
