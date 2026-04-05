'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

type Step = 'choose' | 'pairing' | 'paired';

export default function SetupSTBPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [pairingCode, setPairingCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paired state
  const [pairedRoom, setPairedRoom] = useState('');
  const [pairedHotel, setPairedHotel] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Generate pairing code
  const generateCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stb/generate-code', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPairingCode(data.code);
      setExpiresAt(data.expiresAt);
      setStep('pairing');
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
    }
    setLoading(false);
  }, []);

  // Countdown timer for expiry
  useEffect(() => {
    if (!expiresAt || step !== 'pairing') return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Auto-regenerate
        generateCode();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, step, generateCode]);

  // Poll for pairing status
  useEffect(() => {
    if (step !== 'pairing' || !pairingCode) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/stb/poll?code=${pairingCode}`);
        const data = await res.json();
        if (data.status === 'paired') {
          // Save session data to localStorage
          if (data.sessionData && data.hotelSlug && data.roomCode) {
            localStorage.setItem(
              `neotiv_room_${data.hotelSlug}_${data.roomCode}`,
              JSON.stringify(data.sessionData)
            );
            // Also save STB config
            localStorage.setItem('neotiv_stb_setup', JSON.stringify({
              hotelSlug: data.hotelSlug,
              roomCode: data.roomCode,
            }));
          }
          setPairedRoom(data.roomCode);
          setPairedHotel(data.sessionData?.hotelName || data.hotelSlug);
          setRedirectUrl(data.redirectUrl);
          setStep('paired');
        } else if (data.status === 'expired') {
          generateCode();
        }
      } catch { /* retry next tick */ }
    };
    const interval = setInterval(poll, 3000);
    // Initial poll
    poll();
    return () => clearInterval(interval);
  }, [step, pairingCode, generateCode]);

  // Redirect countdown after pairing
  useEffect(() => {
    if (step !== 'paired' || !redirectUrl) return;
    const interval = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push(redirectUrl);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, redirectUrl, router]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ═══════════════════════════════════════════
  // STEP 3: PAIRED SUCCESS
  // ═══════════════════════════════════════════
  if (step === 'paired') {
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
        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          {/* Success animation */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'linear-gradient(135deg, #14b8a6, #10b981)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56, marginBottom: 32,
            boxShadow: '0 0 60px rgba(20, 184, 166, 0.4)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}>✓</div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px' }}>
            Device Paired!
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '0 0 8px' }}>
            Connected to <span style={{ color: '#5eead4', fontWeight: 600 }}>{pairedHotel}</span>
          </p>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#14b8a6', margin: '16px 0 40px' }}>
            Room {pairedRoom}
          </p>

          {/* Redirect progress */}
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 16,
            padding: '24px 32px',
          }}>
            <p style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '0 0 16px' }}>
              Launching dashboard in {redirectCountdown}s...
            </p>
            <div style={{
              width: '100%', height: 6, borderRadius: 3,
              background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #14b8a6, #10b981)',
                width: `${((5 - redirectCountdown) / 5) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>

          <button
            onClick={() => redirectUrl && router.push(redirectUrl)}
            style={{
              marginTop: 24, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0',
              padding: '12px 28px', borderRadius: 12, fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Go Now →
          </button>
        </div>

        <style>{`
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(20, 184, 166, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 80px rgba(20, 184, 166, 0.6); }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 2: QR CODE / PAIRING SCREEN
  // ═══════════════════════════════════════════
  if (step === 'pairing') {
    const qrValue = `${origin}/stb-pair?code=${pairingCode}`;

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
          {/* Step indicator */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(20, 184, 166, 0.12)', padding: '8px 20px',
              borderRadius: 50, border: '1px solid rgba(20, 184, 166, 0.25)',
              marginBottom: 16,
            }}>
              <span style={{ color: '#5eead4', fontSize: 14, fontWeight: 600 }}>STEP 2 OF 2</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px' }}>
              Scan QR Code from Staff Phone
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, maxWidth: 500, marginInline: 'auto' }}>
              Open the Neotiv app on your phone, go to <strong style={{ color: '#e2e8f0' }}>Rooms</strong>, select a room, and tap <strong style={{ color: '#5eead4' }}>Pair STB</strong>
            </p>
          </div>

          {/* Main QR area */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            gap: '2rem', alignItems: 'center',
          }}>
            {/* Left: Instructions */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 20,
              padding: '2rem', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 20px', color: '#e2e8f0' }}>
                📱 On Your Phone
              </h3>
              {[
                { n: 1, text: 'Open browser & go to your Neotiv domain', icon: '🌐' },
                { n: 2, text: 'Choose "Staff Portal" and login', icon: '🔑' },
                { n: 3, text: 'Go to Rooms → select the room', icon: '🚪' },
                { n: 4, text: 'Tap "📺 Pair STB" button', icon: '📺' },
                { n: 5, text: 'Scan this QR code or enter the code', icon: '📷' },
              ].map(s => (
                <div key={s.n} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: s.n < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(20, 184, 166, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#5eead4', fontSize: 14, fontWeight: 700,
                    flexShrink: 0,
                  }}>{s.n}</div>
                  <span style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.4 }}>
                    {s.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Center: QR Code */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'white', borderRadius: 24, padding: 28,
                display: 'inline-block',
                boxShadow: '0 0 80px rgba(20, 184, 166, 0.2)',
              }}>
                <QRCode value={qrValue} size={240} level="H" />
              </div>

              {/* Pairing Code */}
              <div style={{ marginTop: 24 }}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Pairing Code
                </p>
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 8,
                }}>
                  {pairingCode.split('').map((char, i) => (
                    <div key={i} style={{
                      width: 48, height: 56, borderRadius: 12,
                      background: 'rgba(20, 184, 166, 0.15)',
                      border: '2px solid rgba(20, 184, 166, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: '#5eead4',
                      fontFamily: 'monospace',
                    }}>{char}</div>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div style={{
                marginTop: 20,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${timeLeft < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <span style={{ fontSize: 14, color: timeLeft < 60 ? '#fca5a5' : '#94a3b8' }}>
                  ⏱ Expires in {formatTime(timeLeft)}
                </span>
              </div>

              {/* Waiting indicator */}
              <div style={{
                marginTop: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#14b8a6',
                  animation: 'blink 1.5s ease-in-out infinite',
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Waiting for staff to scan...
                </span>
              </div>
            </div>

            {/* Right: Alternative */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 20,
              padding: '2rem', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>
                📋 Don't have a phone?
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                You can also set up this STB manually by entering the hotel and room information directly.
              </p>
              <button
                onClick={() => setStep('choose')}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', padding: '10px 20px', borderRadius: 10,
                  fontSize: '0.9rem', cursor: 'pointer', width: '100%',
                }}
              >
                ← Manual Setup
              </button>

              <div style={{
                marginTop: 24, paddingTop: 24,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>
                  📥 Need the App?
                </h3>
                <a href="/neotiv-stb.apk" download="neotiv-stb.apk" style={{
                  display: 'block', background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  padding: '12px 20px', borderRadius: 10, color: 'white',
                  textDecoration: 'none', textAlign: 'center',
                  fontSize: '0.9rem', fontWeight: 600,
                }}>
                  ⬇️ Download Neotiv APK
                </a>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 1: CHOOSE — Start or Manual Setup
  // ═══════════════════════════════════════════
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
      <div style={{ maxWidth: 700, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, marginBottom: 20,
            boxShadow: '0 8px 32px rgba(20, 184, 166, 0.3)',
          }}>N</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px' }}>
            Neotiv STB Setup
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
            Configure this set-top box for a hotel room
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99, 102, 241, 0.12)', padding: '8px 20px',
            borderRadius: 50, border: '1px solid rgba(99, 102, 241, 0.25)',
          }}>
            <span style={{ color: '#a5b4fc', fontSize: 14, fontWeight: 600 }}>STEP 1 OF 2</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12, padding: '12px 20px', marginBottom: 24,
            color: '#fca5a5', textAlign: 'center', fontSize: '0.95rem',
          }}>
            {error}
          </div>
        )}

        {/* Primary: QR Pairing */}
        <button
          onClick={generateCode}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            border: 'none', borderRadius: 20, padding: '2rem 2.5rem',
            color: 'white', cursor: loading ? 'wait' : 'pointer',
            textAlign: 'center', marginBottom: '1rem',
            boxShadow: '0 8px 32px rgba(20, 184, 166, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            opacity: loading ? 0.8 : 1,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📺</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>
            {loading ? 'Generating Code...' : 'Start QR Pairing'}
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem', lineHeight: 1.6 }}>
            Show a QR code on this TV — staff scans it with their phone to instantly configure this device. <strong>No typing needed!</strong>
          </p>
          <div style={{
            marginTop: 16, padding: '10px 24px',
            background: 'rgba(255,255,255,0.2)', borderRadius: 10,
            display: 'inline-block', fontSize: '1rem', fontWeight: 600,
          }}>
            {loading ? '⏳ Please wait...' : '▶ Generate QR Code'}
          </div>
        </button>

        {/* Secondary options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          {/* Download APK */}
          <a href="/neotiv-stb.apk" download="neotiv-stb.apk" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            padding: '1.5rem', color: 'white', textDecoration: 'none',
            display: 'block', textAlign: 'center',
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📥</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>Download APK</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Install the Neotiv TV launcher app
            </p>
          </a>

          {/* Manual setup fallback */}
          <ManualSetupCard />
        </div>

        {/* How it works */}
        <div style={{
          marginTop: '2rem', background: 'rgba(255,255,255,0.03)',
          borderRadius: 16, padding: '1.5rem 2rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>
            How QR Pairing Works
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { icon: '📺', title: 'This TV shows a QR code', desc: 'Click "Start QR Pairing" above' },
              { icon: '📱', title: 'Staff scans with phone', desc: 'Select room & scan the code' },
              { icon: '✅', title: 'TV auto-configures', desc: 'Dashboard launches automatically' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 4px' }}>{s.title}</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
                {i < 2 && (
                  <div style={{ color: '#475569', fontSize: '1.5rem', marginTop: 8 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Manual Setup Sub-component (fallback)
// ═══════════════════════════════════════════
function ManualSetupCard() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = localStorage.getItem('neotiv_stb_setup');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.hotelSlug) setHotelSlug(data.hotelSlug);
        if (data.roomCode) setRoomCode(data.roomCode);
      } catch {}
    }
  }, []);

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        padding: '1.5rem', color: 'white', cursor: 'pointer',
        textAlign: 'center', transition: 'transform 0.2s',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⌨️</div>
        <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>Manual Setup</h4>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4 }}>
          Type hotel & room code manually
        </p>
      </button>
    );
  }

  const handleGo = () => {
    if (!hotelSlug.trim() || !roomCode.trim()) return;
    localStorage.setItem('neotiv_stb_setup', JSON.stringify({ 
      hotelSlug: hotelSlug.trim(), 
      roomCode: roomCode.trim() 
    }));
    const url = `/${hotelSlug.trim()}/dashboard/${roomCode.trim()}`;
    router.push(url);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
      padding: '1.5rem', color: 'white',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Manual Setup</h4>
        <button onClick={() => setExpanded(false)} style={{
          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18,
        }}>✕</button>
      </div>
      <input
        type="text" value={hotelSlug}
        onChange={e => setHotelSlug(e.target.value)}
        placeholder="Hotel slug"
        style={{
          width: '100%', padding: '10px 12px', fontSize: '0.85rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: 'white', outline: 'none', marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />
      <input
        type="text" value={roomCode}
        onChange={e => setRoomCode(e.target.value)}
        placeholder="Room code"
        onKeyDown={e => { if (e.key === 'Enter') handleGo(); }}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '0.85rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: 'white', outline: 'none', marginBottom: 10,
          boxSizing: 'border-box',
        }}
      />
      <button onClick={handleGo} disabled={!hotelSlug.trim() || !roomCode.trim()} style={{
        width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 600,
        background: (hotelSlug.trim() && roomCode.trim()) ? '#14b8a6' : 'rgba(255,255,255,0.08)',
        color: (hotelSlug.trim() && roomCode.trim()) ? 'white' : '#64748b',
        border: 'none', borderRadius: 8, cursor: 'pointer',
      }}>
        Launch →
      </button>
    </div>
  );
}
