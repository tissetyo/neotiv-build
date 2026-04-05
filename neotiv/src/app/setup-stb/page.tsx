'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type SetupMethod = 'remote' | 'adb' | 'qr';

export default function SetupSTBPage() {
  const [method, setMethod] = useState<SetupMethod>('remote');
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [origin, setOrigin] = useState('');

  const hotelRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Check URL params for auto-pair (supports /setup-stb?hotel=xxx&room=yyy)
  useEffect(() => {
    setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    const h = params.get('hotel');
    const r = params.get('room');
    if (h && r) {
      setHotelSlug(h);
      setRoomCode(r);
      // Auto-pair after a brief delay so page renders
      setTimeout(() => doPair(h, r), 500);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doPair = useCallback((slug: string, room: string) => {
    if (!slug.trim() || !room.trim()) {
      setErrorMsg('Please fill in both fields');
      setStatus('error');
      return;
    }

    setStatus('pairing');
    setErrorMsg('');

    const finalSlug = slug.trim().toLowerCase();
    const finalRoom = room.trim();

    // Try native bridge first (running inside STB WebView)
    try {
      if (typeof (window as any).NeotivSetup !== 'undefined') {
        (window as any).NeotivSetup.onPaired(finalSlug, finalRoom);
        setStatus('success');
        return;
      }
    } catch (e) {
      console.warn('[Neotiv] Bridge call failed:', e);
    }

    // Fallback: save to localStorage (for browser testing / non-native)
    try {
      localStorage.setItem('neotiv_stb_setup', JSON.stringify({
        hotelSlug: finalSlug,
        roomCode: finalRoom,
      }));
    } catch {}

    setStatus('success');

    // Redirect to dashboard after a moment
    setTimeout(() => {
      window.location.href = `/${finalSlug}/dashboard/${finalRoom}/main`;
    }, 2000);
  }, []);

  const handleSubmit = () => {
    if (status === 'pairing') return;
    doPair(hotelSlug, roomCode);
  };

  // D-pad keyboard navigation between tabs and form fields
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;

      if (e.key === 'Enter' && active && active.tagName === 'BUTTON') {
        e.preventDefault();
        // The D-pad bridge only fires 'keydown', so native 'click' might not trigger.
        // We manually call .click() here.
        active.click();
        return;
      }

      // Tab switching with left/right when a tab is focused
      const tabIndex = tabRefs.current.indexOf(active as HTMLButtonElement);
      if (tabIndex >= 0) {
        if (e.key === 'ArrowRight' && tabIndex < 2) {
          e.preventDefault();
          tabRefs.current[tabIndex + 1]?.focus();
        } else if (e.key === 'ArrowLeft' && tabIndex > 0) {
          e.preventDefault();
          tabRefs.current[tabIndex - 1]?.focus();
        } else if (e.key === 'ArrowDown' && hotelRef.current) {
          e.preventDefault();
          hotelRef.current?.focus();
        }
        return;
      }

      // Form field navigation with up/down arrows
      if (active === hotelRef.current && e.key === 'ArrowDown') {
        e.preventDefault();
        roomRef.current?.focus();
      } else if (active === roomRef.current && e.key === 'ArrowUp') {
        e.preventDefault();
        hotelRef.current?.focus();
      } else if (active === roomRef.current && e.key === 'ArrowDown') {
        e.preventDefault();
        submitRef.current?.focus();
      } else if (active === submitRef.current && e.key === 'ArrowUp') {
        e.preventDefault();
        roomRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus first tab on mount
  useEffect(() => {
    setTimeout(() => tabRefs.current[0]?.focus(), 300);
  }, []);

  const methods: { key: SetupMethod; icon: string; label: string }[] = [
    { key: 'remote', icon: '🎮', label: 'Remote Control' },
    { key: 'adb', icon: '💻', label: 'ADB Command' },
    { key: 'qr', icon: '📱', label: 'QR Pairing' },
  ];

  // ═══════════════ SUCCESS SCREEN ═══════════════
  if (status === 'success') {
    return (
      <div className="stb-page">
        <div className="stb-center">
          <div className="stb-success-icon">✓</div>
          <h1 className="stb-h1">Device Configured!</h1>
          <p className="stb-sub">
            Hotel: <span className="stb-highlight">{hotelSlug}</span>
          </p>
          <p className="stb-room">Room {roomCode}</p>
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

        {/* Method Tabs */}
        <div className="stb-tabs">
          {methods.map((m, i) => (
            <button
              key={m.key}
              ref={(el) => { tabRefs.current[i] = el; }}
              className={`stb-tab ${method === m.key ? 'stb-tab-active' : ''}`}
              onClick={() => setMethod(m.key)}
              data-focusable="true"
            >
              <span className="stb-tab-icon">{m.icon}</span>
              <span className="stb-tab-label">{m.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Remote Control Form ─── */}
        {method === 'remote' && (
          <div className="stb-panel">
            <p className="stb-panel-desc">
              Use the remote control to enter your hotel details below.
              Navigate with <span className="stb-key">▲▼</span> arrows, type with the on-screen keyboard.
            </p>

            <div className="stb-field">
              <label className="stb-label">HOTEL ID</label>
              <input
                ref={hotelRef}
                type="text"
                value={hotelSlug}
                onChange={(e) => { setHotelSlug(e.target.value); setStatus('idle'); }}
                placeholder="e.g. amartha-hotel"
                className="stb-input"
                data-focusable="true"
                autoComplete="off"
              />
            </div>

            <div className="stb-field">
              <label className="stb-label">ROOM CODE</label>
              <input
                ref={roomRef}
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value); setStatus('idle'); }}
                placeholder="e.g. 101"
                className="stb-input"
                data-focusable="true"
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
            </div>

            {status === 'error' && errorMsg && (
              <div className="stb-error">{errorMsg}</div>
            )}

            <button
              ref={submitRef}
              onClick={handleSubmit}
              className={`stb-btn ${hotelSlug.trim() && roomCode.trim() ? 'stb-btn-active' : ''}`}
              style={{ opacity: (!hotelSlug.trim() || !roomCode.trim() || status === 'pairing') ? 0.5 : 1 }}
              data-focusable="true"
            >
              {status === 'pairing' ? '⏳ Connecting...' : '📺 Connect Device'}
            </button>
          </div>
        )}

        {/* ─── ADB Command ─── */}
        {method === 'adb' && (
          <div className="stb-panel">
            <p className="stb-panel-desc">
              For bulk provisioning, use ADB to configure the device without any UI interaction.
            </p>

            <div className="stb-code-block">
              <div className="stb-code-header">Terminal Command</div>
              <pre className="stb-pre">{`adb shell am start \\
  -n com.neotiv.stb/.SetupActivity \\
  --es hotel_slug "your-hotel-slug" \\
  --es room_code "101"`}</pre>
            </div>

            <div className="stb-code-block" style={{ marginTop: 12 }}>
              <div className="stb-code-header">URL Parameter (Browser)</div>
              <pre className="stb-pre">{`${origin || 'https://your-domain.com'}/setup-stb?hotel=your-hotel-slug&room=101`}</pre>
            </div>

            <div className="stb-info-box">
              <span className="stb-info-icon">💡</span>
              <span>The ADB method works immediately — no Wi-Fi setup page needed. Perfect for provisioning multiple devices.</span>
            </div>
          </div>
        )}

        {/* ─── QR Pairing (Coming Soon) ─── */}
        {method === 'qr' && (
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

        {/* Footer hint */}
        <div className="stb-footer">
          <span className="stb-key">◀ ▶</span> Switch tab
          <span className="stb-sep">·</span>
          <span className="stb-key">▲ ▼</span> Navigate
          <span className="stb-sep">·</span>
          <span className="stb-key">OK</span> Select
        </div>
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

  /* ─── Tabs ─── */
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
    animation: fadeIn 0.2s ease;
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

  .stb-btn {
    width: 100%; padding: 14px; font-size: 1rem; font-weight: 600;
    background: rgba(255,255,255,0.06); color: #64748b;
    border: 2px solid transparent; border-radius: 12px; cursor: pointer;
    transition: all 0.2s ease; margin-top: 4px;
  }
  .stb-btn-active {
    background: linear-gradient(135deg, #14b8a6, #0d9488); color: white;
    box-shadow: 0 4px 16px rgba(20,184,166,0.3);
  }
  .stb-btn:focus {
    outline: none; border-color: #5eead4;
    box-shadow: 0 0 0 3px rgba(20,184,166,0.3);
  }
  .stb-btn:disabled { opacity: 0.5; cursor: default; }

  .stb-error {
    background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px; padding: 10px 14px; color: #fca5a5;
    font-size: 0.8rem; margin-bottom: 12px; text-align: center;
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
    margin-top: 14px; padding: 12px 14px; display: flex; gap: 10px;
    background: rgba(20,184,166,0.08); border: 1px solid rgba(20,184,166,0.15);
    border-radius: 10px; color: #94a3b8; font-size: 0.75rem; line-height: 1.5;
    align-items: flex-start;
  }
  .stb-info-icon { font-size: 1rem; flex-shrink: 0; }

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

  /* ─── D-pad hint keys ─── */
  .stb-key {
    display: inline-block; padding: 2px 7px; font-size: 0.65rem;
    background: rgba(255,255,255,0.08); border-radius: 4px;
    color: #94a3b8; font-weight: 600; margin: 0 2px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  /* ─── Footer ─── */
  .stb-footer {
    margin-top: 20px; color: #475569; font-size: 0.7rem;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .stb-sep { color: #334155; }

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
    transition: width 1s linear;
  }
  .stb-progress-anim {
    animation: progress 2s ease-in-out forwards;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
