'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'guest' | 'staff' | 'downloads'>('choose');
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleGuestGo = () => {
    if (!hotelSlug.trim() || !roomCode.trim()) {
      setError('Please fill in both fields');
      return;
    }
    router.push(`/${hotelSlug.trim().toLowerCase()}/dashboard/${roomCode.trim()}`);
  };

  const handleStaffGo = () => {
    if (!hotelSlug.trim()) {
      setError('Please enter your hotel identifier');
      return;
    }
    router.push(`/${hotelSlug.trim().toLowerCase()}/login`);
  };

  return (
    <div className="portal-page">
      {/* Background orbs */}
      <div className="portal-bg-orb portal-bg-orb-1" />
      <div className="portal-bg-orb portal-bg-orb-2" />

      <div className="portal-content">
        {/* Branding */}
        <div className="portal-brand">
          <div className="portal-logo-row">
            <div className="portal-logo-icon">N</div>
            <h1 className="portal-logo-text">Neotiv</h1>
          </div>
          <p className="portal-tagline">Smart Hospitality Platform</p>
        </div>

        {/* CHOOSE MODE */}
        {mode === 'choose' && (
          <div className="portal-cards">
            {/* Guest Card */}
            <button
              onClick={() => { setMode('guest'); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setMode('guest'); setError(''); } }}
              className="portal-card"
              tabIndex={0}
            >
              <div className="portal-card-icon" style={{ background: 'rgba(20,184,166,0.15)' }}>📺</div>
              <h2 className="portal-card-title">Room TV Dashboard</h2>
              <p className="portal-card-desc">Access your in-room entertainment, services, and hotel information</p>
            </button>

            {/* Staff Card */}
            <button
              onClick={() => { setMode('staff'); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setMode('staff'); setError(''); } }}
              className="portal-card"
              tabIndex={0}
            >
              <div className="portal-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🏨</div>
              <h2 className="portal-card-title">Hotel Staff Portal</h2>
              <p className="portal-card-desc">Front office operations, hotel management, and guest services</p>
            </button>

            {/* STB Setup Card - Opens Version Menu */}
            <button
              onClick={() => { setMode('downloads'); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setMode('downloads'); setError(''); } }}
              className="portal-card"
              tabIndex={0}
            >
               <div className="portal-card-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>📥</div>
               <h2 className="portal-card-title">Download STB App</h2>
               <p className="portal-card-desc">View and download the latest Neotiv TV setups for specific hardware</p>
            </button>
          </div>
        )}

        {/* DOWNLOADS MODE */}
        {mode === 'downloads' && (
          <div className="portal-form-wrap" style={{ maxWidth: '600px' }}>
            <div className="portal-form-card" style={{ textAlign: 'left' }}>
              <div className="portal-form-header">
                <button onClick={() => { setMode('choose'); setError(''); }} className="portal-back-btn" tabIndex={0}>←</button>
                <h2 className="portal-form-title">STB App Downloads</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Latest Release */}
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(20, 184, 166, 0.4)', background: 'rgba(20, 184, 166, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>
                        Neotiv Dashboard v1.4.0
                        <span style={{ fontSize: '0.7rem', background: '#14b8a6', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', verticalAlign: 'middle' }}>LATEST / STABLE</span>
                      </h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Released: April 2026</p>
                    </div>
                    <a href={`/neotiv-stb-v1.4.0.apk?v=${Date.now()}`} download="neotiv-stb-v1.4.0.apk" 
                       style={{ background: '#14b8a6', color: 'white', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
                       Download
                    </a>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    <li>✅ <b>Fixes Black Screen</b> on older rooted Android 6/7 TV Boxes (removes forced hardware acceleration).</li>
                    <li>✅ <b>Fixes Greyed-Out "Open" Button</b> on Generic Android 12 firmwares (Signed PROD Release).</li>
                    <li>✅ Better stability and generic AOSP compatability.</li>
                    <li><i>Recommended for all new setups.</i></li>
                  </ul>
                </div>

                {/* Legacy Release */}
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>Neotiv Dashboard v1.1.0</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Legacy TV Release</p>
                    </div>
                    <a href={`/neotiv-stb-legacy.apk?v=${Date.now()}`} download="neotiv-stb-legacy.apk" 
                       style={{ background: '#475569', color: 'white', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
                       Download
                    </a>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    <li>Original Leanback Launcher support.</li>
                    <li>Forces Hardware GPU acceleration (May cause black screen on old cheap units).</li>
                    <li><i>Only use if v1.4.0 cannot be installed.</i></li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* GUEST MODE */}
        {mode === 'guest' && (
          <div className="portal-form-wrap">
            <div className="portal-form-card">
              <div className="portal-form-header">
                <button onClick={() => { setMode('choose'); setError(''); }} className="portal-back-btn">←</button>
                <h2 className="portal-form-title">Room TV Access</h2>
              </div>
              <div className="portal-form-body">
                <div className="portal-field">
                  <label className="portal-label">Hotel ID</label>
                  <input type="text" value={hotelSlug} onChange={(e) => setHotelSlug(e.target.value)}
                    placeholder="e.g. amartha-hotel" className="portal-input" />
                </div>
                <div className="portal-field">
                  <label className="portal-label">Room Code</label>
                  <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="e.g. 417" className="portal-input"
                    onKeyDown={e => { if (e.key === 'Enter') handleGuestGo(); }} />
                </div>
                {error && <p className="portal-error">{error}</p>}
                <button onClick={handleGuestGo} className="portal-submit-btn" style={{ background: '#14b8a6' }}>
                  Open Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAFF MODE */}
        {mode === 'staff' && (
          <div className="portal-form-wrap">
            <div className="portal-form-card">
              <div className="portal-form-header">
                <button onClick={() => { setMode('choose'); setError(''); }} className="portal-back-btn">←</button>
                <h2 className="portal-form-title">Staff Login</h2>
              </div>
              <div className="portal-form-body">
                <div className="portal-field">
                  <label className="portal-label">Hotel ID</label>
                  <input type="text" value={hotelSlug} onChange={(e) => setHotelSlug(e.target.value)}
                    placeholder="e.g. amartha-hotel" className="portal-input"
                    onKeyDown={e => { if (e.key === 'Enter') handleStaffGo(); }} />
                </div>
                {error && <p className="portal-error">{error}</p>}
                <button onClick={handleStaffGo} className="portal-submit-btn" style={{ background: '#6366f1' }}>
                  Continue to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="portal-footer">
          © {new Date().getFullYear()} Neotiv — Smart Hospitality Platform
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .portal-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          font-family: system-ui, -apple-system, sans-serif;
          padding: 16px;
        }

        .portal-bg-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .portal-bg-orb-1 {
          width: 500px; height: 500px; opacity: 0.04;
          background: radial-gradient(circle, #14b8a6 0%, transparent 70%);
          top: -200px; right: -200px;
          animation: portal-pulse 8s ease-in-out infinite;
        }
        .portal-bg-orb-2 {
          width: 400px; height: 400px; opacity: 0.03;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          bottom: -150px; left: -150px;
          animation: portal-pulse 10s ease-in-out infinite reverse;
        }

        .portal-content {
          position: relative; z-index: 1;
          text-align: center;
          max-width: 800px; width: 100%;
        }

        .portal-brand { margin-bottom: 32px; }
        .portal-logo-row {
          display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;
        }
        .portal-logo-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: #14b8a6; color: white; font-weight: 700; font-size: 20px;
        }
        .portal-logo-text {
          font-size: 2rem; font-weight: 700; color: white; margin: 0;
          letter-spacing: -0.5px;
        }
        .portal-tagline {
          color: #94a3b8; font-size: 1rem; margin: 0;
        }

        /* Cards grid */
        .portal-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .portal-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px 20px;
          text-align: left;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          display: block;
          outline: none; /* Removed default outline to use custom */
        }
        .portal-card:hover, .portal-card:focus { 
          transform: scale(1.02); 
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .portal-card:focus {
           border-color: #14b8a6; /* Teal highlight when focused via remote */
        }
        .portal-card-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; margin-bottom: 16px;
        }
        .portal-card-title {
          font-size: 1.1rem; font-weight: 600; margin: 0 0 6px; color: white;
        }
        .portal-card-desc {
          font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.5;
        }

        /* Form */
        .portal-form-wrap { max-width: 420px; margin: 0 auto; }
        .portal-form-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .portal-form-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .portal-back-btn {
          background: none; border: none; color: #94a3b8; font-size: 18px;
          cursor: pointer; padding: 4px 8px;
        }
        .portal-back-btn:hover { color: white; }
        .portal-form-title {
          font-size: 1.2rem; font-weight: 600; color: white; margin: 0;
        }
        .portal-form-body { display: flex; flex-direction: column; gap: 14px; }
        .portal-field { display: flex; flex-direction: column; gap: 4px; }
        .portal-label { font-size: 0.8rem; color: #94a3b8; }
        .portal-input {
          width: 100%; padding: 12px 14px; font-size: 1rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: white; outline: none;
        }
        .portal-input:focus { border-color: #14b8a6; }
        .portal-input::placeholder { color: #475569; }
        .portal-error { color: #f87171; font-size: 0.85rem; margin: 0; }
        .portal-submit-btn {
          width: 100%; padding: 12px; font-size: 1rem; font-weight: 600;
          color: white; border: none; border-radius: 10px; cursor: pointer;
        }

        .portal-footer {
          color: #475569; font-size: 0.7rem; margin-top: 40px;
        }

        /* Phone responsive */
        @media (max-width: 640px) {
          .portal-cards {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .portal-logo-text { font-size: 1.6rem; }
          .portal-card { padding: 20px 16px; }
          .portal-card-icon { width: 40px; height: 40px; font-size: 1.2rem; margin-bottom: 12px; }
          .portal-card-title { font-size: 1rem; }
          .portal-form-card { padding: 20px; }
        }

        /* Tablet */
        @media (min-width: 641px) and (max-width: 900px) {
          .portal-cards {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* TV */
        @media (min-width: 1280px) {
          .portal-logo-text { font-size: 2.5rem; }
          .portal-card { padding: 32px 28px; }
          .portal-card-title { font-size: 1.3rem; }
          .portal-card-desc { font-size: 0.9rem; }
        }

        @keyframes portal-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
