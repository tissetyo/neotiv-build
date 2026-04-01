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
  const [uploadingBg, setUploadingBg] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
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
      let loadedConfig: any = { ...defaultConfig };
      if (data && data.tv_layout_config && Object.keys(data.tv_layout_config).length > 0) {
        loadedConfig = { ...loadedConfig, ...data.tv_layout_config };
      }
      
      // Ensure all apps have a layout entry
      loadedConfig.apps?.forEach((app: any) => {
        const key = `app-${app.id}`;
        if (!loadedConfig.layout[key]) {
          loadedConfig.layout[key] = { colStart: 6, colSpan: 2, rowStart: 8, rowSpan: 2, visible: true, bgColor: '#334155' };
        }
      });
      // Cleanup legacy
      if (loadedConfig.layout.appGrid) delete loadedConfig.layout.appGrid;

      setConfig(loadedConfig);
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

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);

    try {
      const res = await fetch('/api/upload/hotel-background', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setConfig({ ...config, theme: { ...config.theme, bgUrl: data.url } });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
    if (bgInputRef.current) bgInputRef.current.value = '';
    setUploadingBg(false);
  };

  const gridRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.PointerEvent, key: string) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    e.preventDefault();
    if (!gridRef.current) return;
    
    // Use the current ref values at the start of the drag
    const initialX = e.clientX;
    const initialY = e.clientY;
    
    // We must use functional state updates here if we don't want to capture stale config.
    // However, for the initial position, we can just grab it from the current render's config.
    const w = config.layout[key];
    const initialCol = w.colStart || 1;
    const initialRow = w.rowStart || 1;
    const spanCol = w.colSpan || 1;
    const spanRow = w.rowSpan || 1;

    const cellW = gridRef.current.offsetWidth / 12;
    const cellH = gridRef.current.offsetHeight / 12;

    const onMove = (ev: PointerEvent) => {
      const dX = ev.clientX - initialX;
      const dY = ev.clientY - initialY;
      const moveX = Math.round(dX / cellW);
      const moveY = Math.round(dY / cellH);

      let newCol = Math.max(1, initialCol + moveX);
      let newRow = Math.max(1, initialRow + moveY);
      if (newCol + spanCol - 1 > 12) newCol = 13 - spanCol;
      if (newRow + spanRow - 1 > 12) newRow = 13 - spanRow;

      setConfig((prev: any) => ({
        ...prev,
        layout: { ...prev.layout, [key]: { ...prev.layout[key], colStart: newCol, rowStart: newRow } }
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gridRef.current) return;
    
    const initialX = e.clientX;
    const initialY = e.clientY;
    
    const w = config.layout[key];
    const initialSpanX = w.colSpan || 1;
    const initialSpanY = w.rowSpan || 1;
    const colStart = w.colStart || 1;
    const rowStart = w.rowStart || 1;

    const cellW = gridRef.current.offsetWidth / 12;
    const cellH = gridRef.current.offsetHeight / 12;

    const onMove = (ev: PointerEvent) => {
      const dX = ev.clientX - initialX;
      const dY = ev.clientY - initialY;
      const moveX = Math.round(dX / cellW);
      const moveY = Math.round(dY / cellH);

      let newSpanX = Math.max(1, initialSpanX + moveX);
      let newSpanY = Math.max(1, initialSpanY + moveY);
      if (colStart + newSpanX - 1 > 12) newSpanX = 13 - colStart;
      if (rowStart + newSpanY - 1 > 12) newSpanY = 13 - rowStart;

      setConfig((prev: any) => ({
        ...prev,
        layout: { ...prev.layout, [key]: { ...prev.layout[key], colSpan: newSpanX, rowSpan: newSpanY } }
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (loading || !config) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CANVAS EXPERIMENT */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2">Visual Layout Builder</h2>
            <p className="text-sm text-slate-400 mb-6">Drag widgets to move them, or drag the bottom-right corner to resize. This grid represents the 12x12 TV layout.</p>
            
            <div 
              ref={gridRef}
              className="w-full aspect-video bg-slate-800 rounded-lg relative grid gap-1 p-2"
              style={{
                gridTemplateColumns: 'repeat(12, 1fr)',
                gridTemplateRows: 'repeat(12, 1fr)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: 'calc((100% - 16px) / 12) calc((100% - 16px) / 12)',
                backgroundPosition: '8px 8px'
              }}
            >
              {Object.keys(config.layout).map((key) => {
                const w = config.layout[key];
                if (w.visible === false) return null;
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => startDrag(e, key)}
                    className="bg-teal-500/80 border border-teal-300 rounded shadow-md relative group select-none touch-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center overflow-hidden hover:bg-teal-400/90 transition-colors"
                    style={{ gridColumn: `${w.colStart || 1} / span ${w.colSpan || 1}`, gridRow: `${w.rowStart || 1} / span ${w.rowSpan || 1}`, backgroundColor: w.bgColor || '' }}
                  >
                    <span className="text-xs font-bold text-white tv-text-shadow text-center px-1 leading-tight pointer-events-none">
                      {key.startsWith('app-') ? (config.apps.find((a: any) => a.id === key.replace('app-', ''))?.name || key) : key.replace(/([A-Z])/g, ' $1').trim().replace('Card', '')}
                    </span>
                    <span className="text-[10px] text-teal-900/60 pointer-events-none">{w.colSpan}x{w.rowSpan}</span>

                    {/* Resize Handle */}
                    <div 
                      className="resize-handle absolute bottom-0 right-0 w-5 h-5 bg-teal-800/40 opacity-0 group-hover:opacity-100 cursor-se-resize flex items-end justify-end p-1 transition-opacity rounded-tl-lg"
                      onPointerDown={(e) => startResize(e, key)}
                    >
                      <div className="w-2 h-2 rounded-full border border-teal-300 bg-teal-500 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Widget Visibility & Color</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(config.layout).map((key) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer overflow-hidden">
                    <input
                      type="checkbox"
                      checked={config.layout[key].visible !== false}
                      onChange={(e) => setConfig({
                        ...config,
                        layout: { ...config.layout, [key]: { ...config.layout[key], visible: e.target.checked } }
                      })}
                      className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500 outline-none shrink-0"
                    />
                    <span className="font-medium text-sm text-slate-700 capitalize truncate">
                      {key.startsWith('app-') ? (config.apps.find((a: any) => a.id === key.replace('app-', ''))?.name || key) : key.replace(/([A-Z])/g, ' $1').trim().replace('Card', '')}
                    </span>
                  </label>
                  <label className="flex items-center justify-center shrink-0 cursor-pointer pl-2 border-l border-slate-200">
                    <input
                      title={`Theme Color for ${key}`}
                      type="color"
                      value={config.layout[key].bgColor || '#334155'}
                      onChange={(e) => setConfig({
                        ...config,
                        layout: { ...config.layout, [key]: { ...config.layout[key], bgColor: e.target.value } }
                      })}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer overflow-hidden opacity-90 hover:opacity-100 transition-opacity bg-transparent"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT METADATA EXPERIMENT */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Theme Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Light Widgets Opacity: {config.theme.opacityLight}</label>
                <input type="range" min="0" max="1" step="0.01" value={config.theme.opacityLight}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, opacityLight: parseFloat(e.target.value) } })}
                  className="w-full accent-teal-500" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dark Widgets Opacity: {config.theme.opacityDark}</label>
                <input type="range" min="0" max="1" step="0.01" value={config.theme.opacityDark}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, opacityDark: parseFloat(e.target.value) } })}
                  className="w-full accent-teal-500" />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Dashboard Background</label>
                <div className="flex items-center gap-4">
                  {config.theme.bgUrl ? (
                    <div className="w-24 h-16 rounded border border-slate-200 overflow-hidden relative group shrink-0 shadow-sm">
                      <img src={config.theme.bgUrl} alt="Background" className="w-full h-full object-cover" />
                      <button onClick={() => setConfig({ ...config, theme: { ...config.theme, bgUrl: null } })}
                        className="absolute inset-0 bg-black/60 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 shrink-0 text-xs shadow-inner">
                      Default Ocean
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" ref={bgInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleBgUpload} />
                    <button onClick={() => bgInputRef.current?.click()} disabled={uploadingBg}
                      className="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200 shadow-sm w-full text-left flex justify-between items-center">
                      {uploadingBg ? 'Uploading...' : 'Upload Image'} <span className="text-[10px] text-slate-400 uppercase font-mono">JPG/PNG</span>
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">Recommended size: 1920x1080px. Clear this to restore default.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">App Launchers</h2>
              <button
                onClick={() => setConfig({ ...config, apps: [...config.apps, { id: `app-${Date.now()}`, name: "New App", url: "", icon: "/apps/default.png" }] })}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >+ Add App</button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleIconUpload} />

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 pb-4">
              {config.apps.map((app: any, idx: number) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                  <button onClick={() => {
                    const newApps = [...config.apps];
                    newApps.splice(idx, 1);
                    setConfig({ ...config, apps: newApps });
                  }} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-lg leading-none font-bold opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                  
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                        <img src={app.icon} alt="Icon" className="w-full h-full object-contain" />
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
                      <input type="text" value={app.url} placeholder="Package / Deep Link"
                        onChange={(e) => {
                          const newApps = [...config.apps];
                          newApps[idx].url = e.target.value;
                          setConfig({ ...config, apps: newApps });
                        }}
                        className="w-full text-[11px] bg-transparent border-b border-slate-300 focus:border-teal-500 outline-none py-1 text-slate-600 font-mono" />
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
