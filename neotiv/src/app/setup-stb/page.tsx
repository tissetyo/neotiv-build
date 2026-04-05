'use client';

import { useRef, useEffect, useState } from 'react';

export default function SetupSTBPage() {
  const [origin, setOrigin] = useState('');
  const [paired, setPaired] = useState(false);
  const [pairedSlug, setPairedSlug] = useState('');
  const [pairedRoom, setPairedRoom] = useState('');

  const hotelRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Read tab from URL params (native <a> links handle tab switching)
  const [tab, setTab] = useState('remote');

  useEffect(() => {
    setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'adb' || t === 'qr') setTab(t);

    // Auto-pair from URL params
    const h = params.get('hotel');
    const r = params.get('room');
    if (h && r) {
      doPair(h, r);
    }
  }, []);

  function doPair(slug: string, room: string) {
    const finalSlug = slug.trim().toLowerCase();
    const finalRoom = room.trim();

    if (!finalSlug || !finalRoom) {
      alert('Please enter both Hotel ID and Room Code');
      return;
    }

    // Try native bridge (running inside STB WebView)
    try {
      if (typeof (window as any).NeotivSetup !== 'undefined') {
        (window as any).NeotivSetup.onPaired(finalSlug, finalRoom);
        setPaired(true);
        setPairedSlug(finalSlug);
        setPairedRoom(finalRoom);
        return;
      }
    } catch (e) {
      console.warn('[Neotiv] Bridge call failed:', e);
    }

    // Fallback: save to localStorage
    try {
      localStorage.setItem('neotiv_stb_setup', JSON.stringify({
        hotelSlug: finalSlug,
        roomCode: finalRoom,
      }));
    } catch {}

    setPaired(true);
    setPairedSlug(finalSlug);
    setPairedRoom(finalRoom);

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = `/${finalSlug}/dashboard/${finalRoom}/main`;
    }, 2000);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = hotelRef.current?.value || '';
    const room = roomRef.current?.value || '';
    doPair(slug, room);
  }

  // ═══════════════ SUCCESS SCREEN ═══════════════
  if (paired) {
    return (
      <div className="stb-page">
        <div className="stb-center">
          <div className="stb-success-icon">✓</div>
          <h1 className="stb-h1">Device Configured!</h1>
          <p className="stb-sub">
            Hotel: <span className="stb-highlight">{pairedSlug}</span>
          </p>
          <p className="stb-room">Room {pairedRoom}</p>
          <div className="stb-box" style={{ marginTop: 24 }}>
            <p className="stb-sub">Launching dashboard...</p>
            <div className="stb-progress-track" style={{ marginTop: 12 }}>
              <div className="stb-progress-bar stb-progress-anim" />
            </div>
          </div>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  // ═══════════════ MAIN SETUP SCREEN ═══════════════
  return (
    <div className="stb-page">
      <div className="stb-center">
        {/* Header */}
        <div className="stb-logo">N</div>
        <h1 className="stb-h1">Neotiv STB Setup</h1>
        <p className="stb-sub" style={{ marginBottom: 20 }}>Choose a setup method</p>

        {/* Method Tabs — native <a> links so WebView handles them reliably */}
        <div className="stb-tabs">
          <a href="?tab=remote" className={`stb-tab ${tab === 'remote' ? 'stb-tab-active' : ''}`}>
            <span className="stb-tab-icon">🎮</span>
            <span className="stb-tab-label">Remote Control</span>
          </a>
          <a href="?tab=adb" className={`stb-tab ${tab === 'adb' ? 'stb-tab-active' : ''}`}>
            <span className="stb-tab-icon">💻</span>
            <span className="stb-tab-label">ADB Command</span>
          </a>
          <a href="?tab=qr" className={`stb-tab ${tab === 'qr' ? 'stb-tab-active' : ''}`}>
            <span className="stb-tab-icon">📱</span>
            <span className="stb-tab-label">QR Pairing</span>
          </a>
        </div>

        {/* ─── Remote Control Form ─── */}
        {tab === 'remote' && (
          <form ref={formRef} onSubmit={handleFormSubmit} className="stb-panel">
            <p className="stb-panel-desc">
              Use the remote control to enter your hotel details below.
            </p>

            <div className="stb-field">
              <label htmlFor="hotel-input" className="stb-label">HOTEL ID</label>
              <input
                id="hotel-input"
                ref={hotelRef}
                type="text"
                name="hotel"
                placeholder="e.g. amartha-hotel"
                className="stb-input"
                autoComplete="off"
              />
            </div>

            <div className="stb-field">
              <label htmlFor="room-input" className="stb-label">ROOM CODE</label>
              <input
                id="room-input"
                ref={roomRef}
                type="text"
                name="room"
                placeholder="e.g. 101"
                className="stb-input"
                autoComplete="off"
              />
            </div>

            {/* Always green, always clickable. Validation on submit. */}
            <button type="submit" className="stb-btn">
              📺 Connect Device
            </button>
          </form>
        )}

        {/* ─── ADB Command ─── */}
        {tab === 'adb' && (
          <div className="stb-panel">
            <p className="stb-panel-desc">
              For bulk provisioning, use ADB to configure the device without any UI interaction.
            </p>

            <div className="stb-code-block">
              <div className="stb-code-header">Terminal Command</div>
              <pre className="stb-pre">{`adb shell am start \\
  -n com.neotiv.stb/.SetupActivity \\
  --es hotel_slug "your-hotel" \\
  --es room_code "101"`}</pre>
            </div>

            <div className="stb-code-block" style={{ marginTop: 12 }}>
              <div className="stb-code-header">URL Parameter</div>
              <pre className="stb-pre">{`${origin || 'https://your-domain.com'}/setup-stb?hotel=your-hotel&room=101`}</pre>
            </div>

            <div className="stb-info-box">
              💡 The ADB method works immediately — perfect for provisioning multiple devices.
            </div>
          </div>
        )}

        {/* ─── QR Pairing (Coming Soon) ─── */}
        {tab === 'qr' && (
          <div className="stb-panel">
            <div className="stb-coming-soon">
              <div className="stb-qr-placeholder">
                <div className="stb-qr-grid">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="stb-qr-cell" />
                  ))}
                </div>
              </div>
              <h2 className="stb-h2">QR Pairing</h2>
              <p className="stb-sub">Coming Soon</p>
              <p className="stb-panel-desc" style={{ marginTop: 12 }}>
                Scan a QR code from your phone to instantly pair this device to a room.
                No typing required.
              </p>
              <div className="stb-badge">🚧 In Development</div>
            </div>
          </div>
        )}
      </div>
      <style>{css}</style>
    </div>
  );
}

// ═══════════════ STYLES ═══════════════
const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .stb-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .stb-center { text-align: center; max-width: 520px; width: 100%; }

  .stb-logo {
    width: 56px; height: 56px; border-radius: 14px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 700; margin-bottom: 16px;
    box-shadow: 0 4px 20px rgba(20,184,166,0.3);
  }

  .stb-h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
  .stb-h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 4px; }
  .stb-sub { color: #94a3b8; font-size: 0.85rem; }
  .stb-highlight { color: #5eead4; font-weight: 600; }
  .stb-room { font-size: 2.5rem; font-weight: 700; color: #14b8a6; margin-top: 8px; }

  /* ─── Tabs (native <a> links) ─── */
  .stb-tabs {
    display: flex; gap: 6px; margin-bottom: 16px;
    background: rgba(255,255,255,0.03);
    border-radius: 14px; padding: 5px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .stb-tab {
    flex: 1; padding: 10px 8px; border: 2px solid transparent;
    background: transparent; border-radius: 10px; cursor: pointer;
    color: #64748b; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    text-decoration: none;
  }
  .stb-tab:focus {
    outline: none; border-color: #14b8a6;
    box-shadow: 0 0 0 2px rgba(20,184,166,0.3);
  }
  .stb-tab-active {
    background: rgba(20,184,166,0.12); color: #5eead4;
    border-color: rgba(20,184,166,0.3);
  }
  .stb-tab-icon { font-size: 1.2rem; }
  .stb-tab-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ─── Panel ─── */
  .stb-panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px; padding: 20px;
    text-align: left;
  }

  .stb-panel-desc {
    color: #94a3b8; font-size: 0.8rem; line-height: 1.5;
    margin-bottom: 16px;
  }

  /* ─── Form ─── */
  .stb-field { margin-bottom: 14px; }
  .stb-label {
    display: block; color: #64748b; font-size: 0.7rem;
    font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px;
  }

  .stb-input {
    width: 100%; padding: 14px 16px; font-size: 1rem;
    background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.1);
    border-radius: 10px; color: white; outline: none;
    transition: border-color 0.2s ease;
  }
  .stb-input:focus {
    border-color: #14b8a6;
    background: rgba(20,184,166,0.08);
    box-shadow: 0 0 0 3px rgba(20,184,166,0.15);
  }
  .stb-input::placeholder { color: #475569; }

  /* Button — ALWAYS green, no conditional styling */
  .stb-btn {
    width: 100%; padding: 14px; font-size: 1rem; font-weight: 600;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white; border: 2px solid transparent;
    border-radius: 12px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(20,184,166,0.3);
    margin-top: 4px;
  }
  .stb-btn:focus {
    outline: none; border-color: #5eead4;
    box-shadow: 0 0 0 3px rgba(20,184,166,0.3);
  }

  /* ─── ADB Code Block ─── */
  .stb-code-block {
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; overflow: hidden;
  }
  .stb-code-header {
    padding: 8px 14px; background: rgba(255,255,255,0.04);
    font-size: 0.65rem; color: #64748b; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .stb-pre {
    padding: 14px; font-size: 0.78rem; color: #5eead4;
    font-family: 'SF Mono', 'Fira Code', monospace;
    white-space: pre-wrap; word-break: break-all;
    line-height: 1.6; margin: 0;
  }

  .stb-info-box {
    margin-top: 14px; padding: 12px 14px;
    background: rgba(20,184,166,0.08); border: 1px solid rgba(20,184,166,0.15);
    border-radius: 10px; color: #94a3b8; font-size: 0.75rem; line-height: 1.5;
  }

  /* ─── QR Coming Soon ─── */
  .stb-coming-soon { text-align: center; padding: 16px 0; }

  .stb-qr-placeholder {
    width: 120px; height: 120px; margin: 0 auto 20px;
    background: rgba(255,255,255,0.04); border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    border: 2px dashed rgba(255,255,255,0.1);
    position: relative; overflow: hidden;
  }
  .stb-qr-placeholder::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(20,184,166,0.08) 100%);
  }

  .stb-qr-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
    width: 50px; opacity: 0.3;
  }
  .stb-qr-cell {
    width: 14px; height: 14px; border-radius: 3px;
    background: white;
  }
  .stb-qr-cell:nth-child(2), .stb-qr-cell:nth-child(4), .stb-qr-cell:nth-child(6), .stb-qr-cell:nth-child(8) {
    background: transparent;
  }

  .stb-badge {
    display: inline-block; margin-top: 16px;
    padding: 6px 14px; border-radius: 20px;
    background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25);
    color: #fbbf24; font-size: 0.7rem; font-weight: 600;
  }

  /* ─── Success ─── */
  .stb-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #10b981);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 36px; margin-bottom: 20px;
    box-shadow: 0 8px 30px rgba(20,184,166,0.4);
    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .stb-box {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 16px;
  }

  .stb-progress-track {
    width: 100%; height: 5px; border-radius: 3px;
    background: rgba(255,255,255,0.1); overflow: hidden;
  }
  .stb-progress-bar {
    height: 100%; border-radius: 3px; background: #14b8a6;
  }
  .stb-progress-anim {
    animation: progress 2s ease-in-out forwards;
  }

  @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes progress { from { width: 0%; } to { width: 100%; } }

  @media (min-width: 1280px) {
    .stb-h1 { font-size: 2rem; }
    .stb-center { max-width: 560px; }
    .stb-input { font-size: 1.1rem; padding: 16px 18px; }
    .stb-tab-label { font-size: 0.7rem; }
    .stb-room { font-size: 3rem; }
  }

  @media (max-width: 480px) {
    .stb-h1 { font-size: 1.2rem; }
    .stb-tab { padding: 8px 6px; }
    .stb-tab-icon { font-size: 1rem; }
    .stb-tab-label { font-size: 0.55rem; }
    .stb-room { font-size: 2rem; }
  }
`;
