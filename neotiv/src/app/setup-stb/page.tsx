'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * STB Setup Page — accessed from the STB's built-in browser.
 * 
 * Flow:
 * 1. Staff opens this URL on the STB browser
 * 2. Enters hotel slug and room code
 * 3. Clicks "Launch Dashboard" → redirects to the room dashboard
 * 4. Option to download Fully Kiosk Browser for proper kiosk mode
 * 
 * URL: /setup-stb
 */
export default function SetupSTBPage() {
  const router = useRouter();
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [step, setStep] = useState<'config' | 'options'>('config');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);

    // Check if previously configured
    const saved = localStorage.getItem('neotiv_stb_setup');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.hotelSlug) setHotelSlug(data.hotelSlug);
        if (data.roomCode) setRoomCode(data.roomCode);
      } catch {}
    }
  }, []);

  const handleConfigure = () => {
    if (!hotelSlug.trim() || !roomCode.trim()) return;
    const url = `${origin}/${hotelSlug.trim()}/dashboard/${roomCode.trim()}`;
    setDashboardUrl(url);
    localStorage.setItem('neotiv_stb_setup', JSON.stringify({ 
      hotelSlug: hotelSlug.trim(), 
      roomCode: roomCode.trim() 
    }));
    setStep('options');
  };

  const handleLaunchNow = () => {
    if (dashboardUrl) {
      window.location.href = dashboardUrl;
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for STB browsers without clipboard API
      const input = document.createElement('input');
      input.value = dashboardUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleGoFullscreen = () => {
    try {
      document.documentElement.requestFullscreen?.();
    } catch {}
    setTimeout(() => {
      if (dashboardUrl) window.location.href = dashboardUrl;
    }, 500);
  };

  if (step === 'options') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ maxWidth: 900, width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(20, 184, 166, 0.15)', padding: '8px 20px',
              borderRadius: 50, marginBottom: 16, border: '1px solid rgba(20, 184, 166, 0.3)',
            }}>
              <span style={{ fontSize: 18, color: '#5eead4' }}>✓ Configured</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
              Room {roomCode}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: 8 }}>
              Choose how to launch the dashboard on this STB
            </p>
          </div>

          {/* URL Display */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px',
            marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <code style={{ fontSize: '0.95rem', color: '#5eead4', wordBreak: 'break-all', flex: 1 }}>
              {dashboardUrl}
            </code>
            <button onClick={handleCopyUrl} style={{
              background: copied ? '#22c55e' : 'rgba(255,255,255,0.1)',
              border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8,
              cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}>
              {copied ? '✓ Copied' : '📋 Copy URL'}
            </button>
          </div>

          {/* Options Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr',
            gap: '1.2rem',
          }}>
            {/* Option 1: Download Neotiv Launcher (PRIMARY) */}
            <a href="/neotiv-stb.apk" download="neotiv-stb.apk" style={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              border: 'none', borderRadius: 16, padding: '2rem',
              color: 'white', cursor: 'pointer', textAlign: 'center',
              textDecoration: 'none', display: 'block',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 8px 32px rgba(20, 184, 166, 0.3)',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📥</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>Download Neotiv Launcher</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem', lineHeight: 1.5 }}>
                Install the Neotiv TV app — auto-boots to your dashboard, 
                perfect D-pad remote support, no address bar
              </p>
              <div style={{
                marginTop: 16, padding: '8px 20px', background: 'rgba(255,255,255,0.2)',
                borderRadius: 8, display: 'inline-block', fontSize: '1rem', fontWeight: 600
              }}>
                ⬇️ Download APK (4.2 MB)
              </div>
            </a>

            {/* Secondary options row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Quick Launch in browser */}
              <button onClick={handleGoFullscreen} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.2rem',
                color: 'white', cursor: 'pointer', textAlign: 'left',
                transition: 'transform 0.2s',
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>🚀</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Quick Launch</h4>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Open in browser (no install)
                </p>
              </button>

              {/* Fully Kiosk alternative */}
              <a href="https://www.fully-kiosk.com/en/#download" target="_blank" rel="noopener" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.2rem',
                color: 'white', cursor: 'pointer', textAlign: 'left',
                textDecoration: 'none', display: 'block',
                transition: 'transform 0.2s',
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>🔒</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Fully Kiosk</h4>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Third-party kiosk browser
                </p>
              </a>
            </div>
          </div>

          {/* Instructions after downloading */}
          <div style={{
            marginTop: '2rem', background: 'rgba(255,255,255,0.03)',
            borderRadius: 16, padding: '2rem', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h3 style={{ margin: '0 0 1.2rem', fontSize: '1.2rem' }}>
              📋 After downloading the APK
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { n: 1, t: 'Tap the downloaded file to install (allow "Unknown Sources" if prompted)' },
                { n: 2, t: 'Open the Neotiv TV app' },
                { n: 3, t: 'Enter the server URL, hotel slug, and room code' },
                { n: 4, t: 'Tap "Launch Dashboard" — it becomes your home screen!' },
                { n: 5, t: 'On reboot, it auto-starts — no setup needed again' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    minWidth: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(20, 184, 166, 0.2)', color: '#5eead4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 700,
                  }}>{s.n}</div>
                  <span style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '32px' }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Back button */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button onClick={() => setStep('config')} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8', padding: '10px 24px', borderRadius: 8,
              cursor: 'pointer', fontSize: '0.9rem',
            }}>
              ← Change Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONFIG STEP
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: 480, width: '100%',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 24, padding: '3rem',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, marginBottom: 16,
          }}>N</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700 }}>
            Neotiv STB Setup
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem' }}>
            Configure this device for a room
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block', marginBottom: 6,
              color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500,
            }}>Hotel Slug</label>
            <input
              type="text"
              value={hotelSlug}
              onChange={e => setHotelSlug(e.target.value)}
              placeholder="amartha-bali"
              style={{
                width: '100%', padding: '14px 16px', fontSize: '1.1rem',
                background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 12, color: 'white', outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#14b8a6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 6,
              color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500,
            }}>Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              placeholder="101"
              style={{
                width: '100%', padding: '14px 16px', fontSize: '1.1rem',
                background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 12, color: 'white', outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#14b8a6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              onKeyDown={e => { if (e.key === 'Enter') handleConfigure(); }}
            />
          </div>

          <button
            onClick={handleConfigure}
            disabled={!hotelSlug.trim() || !roomCode.trim()}
            style={{
              width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600,
              background: (hotelSlug.trim() && roomCode.trim())
                ? 'linear-gradient(135deg, #14b8a6, #0d9488)'
                : 'rgba(255,255,255,0.08)',
              color: (hotelSlug.trim() && roomCode.trim()) ? 'white' : '#64748b',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Continue →
          </button>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '2rem',
          color: '#475569', fontSize: '0.8rem',
        }}>
          Open this page on the STB browser at:<br />
          <code style={{ color: '#5eead4' }}>{origin || 'https://your-domain.com'}/setup-stb</code>
        </p>
      </div>
    </div>
  );
}
