'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

type Step = 'loading' | 'pairing' | 'paired';

export default function SetupSTBPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
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
    // Auto-generate QR code on page load
    generateCode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (remaining <= 0) generateCode();
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
          if (data.sessionData && data.hotelSlug && data.roomCode) {
            localStorage.setItem(
              `neotiv_room_${data.hotelSlug}_${data.roomCode}`,
              JSON.stringify(data.sessionData)
            );
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
      <div className="stb-page">
        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <div className="stb-success-icon">✓</div>
          <h1 className="stb-heading-xl">Device Paired!</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '0 0 8px' }}>
            Connected to <span style={{ color: '#5eead4', fontWeight: 600 }}>{pairedHotel}</span>
          </p>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#14b8a6', margin: '16px 0 40px' }}>
            Room {pairedRoom}
          </p>
          <div className="stb-card" style={{ padding: '24px 32px' }}>
            <p style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '0 0 16px' }}>
              Launching dashboard in {redirectCountdown}s...
            </p>
            <div className="stb-progress-track">
              <div className="stb-progress-bar" style={{ width: `${((5 - redirectCountdown) / 5) * 100}%` }} />
            </div>
          </div>
          <button onClick={() => redirectUrl && router.push(redirectUrl)} className="stb-btn-ghost" style={{ marginTop: 24 }}>
            Go Now →
          </button>
        </div>
        <style>{stbStyles}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 2: QR CODE / PAIRING SCREEN
  // ═══════════════════════════════════════════
  if (step === 'pairing') {
    const qrValue = `${origin}/stb-pair?code=${pairingCode}`;

    return (
      <div className="stb-page">
        <div style={{ maxWidth: 960, width: '100%' }}>
          {/* Step indicator */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="stb-badge stb-badge-teal">STEP 2 OF 2</div>
            <h1 className="stb-heading-lg">Scan QR Code from Staff Phone</h1>
            <p className="stb-subtext" style={{ maxWidth: 440, margin: '0 auto' }}>
              Open Neotiv on your phone → <strong style={{ color: '#e2e8f0' }}>Rooms</strong> → select room → <strong style={{ color: '#5eead4' }}>Pair STB</strong>
            </p>
          </div>

          {/* QR Code - centered and big */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="stb-qr-container">
              <QRCode value={qrValue} size={220} level="H" />
            </div>

            {/* Pairing Code */}
            <div style={{ marginTop: 20 }}>
              <p className="stb-label">Pairing Code</p>
              <div className="stb-code-grid">
                {pairingCode.split('').map((char, i) => (
                  <div key={i} className="stb-code-char">{char}</div>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className={`stb-timer ${timeLeft < 60 ? 'stb-timer-urgent' : ''}`}>
              ⏱ Expires in {formatTime(timeLeft)}
            </div>

            {/* Waiting indicator */}
            <div className="stb-waiting">
              <div className="stb-dot" />
              Waiting for staff to scan...
            </div>
          </div>

          {/* Instructions - responsive grid */}
          <div className="stb-2col">
            {/* Left: Phone steps */}
            <div className="stb-card">
              <h3 className="stb-card-title">📱 On Your Phone</h3>
              {[
                'Open browser & go to your Neotiv domain',
                'Choose "Staff Portal" and login',
                'Go to Rooms → select the room',
                'Tap "📺 Pair STB" button',
                'Enter the code shown above',
              ].map((text, i) => (
                <div key={i} className="stb-step-row">
                  <div className="stb-step-num">{i + 1}</div>
                  <span className="stb-step-text">{text}</span>
                </div>
              ))}
            </div>

            {/* Right: Alternatives */}
            <div className="stb-card">
              <h3 className="stb-card-title">📋 Other Options</h3>
              <a href="/" className="stb-btn-outline" style={{ marginBottom: 16, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                ← Manual Setup
              </a>
              <a href="/neotiv-stb.apk" download="neotiv-stb.apk" className="stb-btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                ⬇️ Download Neotiv APK
              </a>
            </div>
          </div>
        </div>
        <style>{stbStyles}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LOADING — Auto-generating QR code
  // ═══════════════════════════════════════════
  return (
    <div className="stb-page">
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div className="stb-logo">N</div>
        <h1 className="stb-heading-xl">Neotiv STB Setup</h1>
        <p className="stb-subtext" style={{ marginBottom: 32 }}>Preparing QR code for pairing...</p>

        {error ? (
          <div>
            <div className="stb-error">{error}</div>
            <button onClick={generateCode} className="stb-btn-primary" style={{ marginTop: 16 }}>
              ↻ Try Again
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="stb-spinner" />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connecting to server...</p>
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/neotiv-stb.apk" download="neotiv-stb.apk" className="stb-btn-ghost" style={{ textDecoration: 'none' }}>
            📥 Download APK
          </a>
          <a href="/" className="stb-btn-ghost" style={{ textDecoration: 'none' }}>
            ← Back to Portal
          </a>
        </div>
      </div>
      <style>{stbStyles}</style>
    </div>
  );
}



// ═══════════════════════════════════════════
// STYLES — pure CSS, STB-compatible, responsive
// ═══════════════════════════════════════════
const stbStyles = `
  * { box-sizing: border-box; }
  
  .stb-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .stb-logo {
    width: 64px; height: 64px; border-radius: 16px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700; margin-bottom: 16px;
  }

  .stb-heading-xl { font-size: 1.8rem; font-weight: 800; margin: 0 0 8px; }
  .stb-heading-lg { font-size: 1.5rem; font-weight: 700; margin: 0 0 8px; }
  .stb-subtext { color: #94a3b8; font-size: 0.95rem; margin: 0; line-height: 1.5; }

  .stb-badge {
    display: inline-block; padding: 6px 16px; border-radius: 50px;
    font-size: 12px; font-weight: 600; margin-bottom: 12px;
  }
  .stb-badge-teal { background: rgba(20,184,166,0.12); border: 1px solid rgba(20,184,166,0.25); color: #5eead4; }
  .stb-badge-indigo { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }

  .stb-card {
    background: rgba(255,255,255,0.04); border-radius: 16px;
    padding: 20px; border: 1px solid rgba(255,255,255,0.06);
  }
  .stb-card-title { font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: #e2e8f0; }

  .stb-error {
    background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 12px; padding: 12px 20px; margin-bottom: 20px;
    color: #fca5a5; text-align: center; font-size: 0.9rem;
  }

  .stb-primary-action {
    width: 100%; background: linear-gradient(135deg, #14b8a6, #0d9488);
    border: none; border-radius: 16px; padding: 24px 20px;
    color: white; cursor: pointer; text-align: center; margin-bottom: 8px;
  }
  .stb-action-title { margin: 0 0 6px; font-size: 1.3rem; font-weight: 700; }
  .stb-action-desc { margin: 0; opacity: 0.9; font-size: 0.9rem; line-height: 1.5; }
  .stb-action-cta {
    margin-top: 12px; padding: 8px 20px; background: rgba(255,255,255,0.2);
    border-radius: 8px; display: inline-block; font-size: 0.9rem; font-weight: 600;
  }

  .stb-option-card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 16px; color: white; text-align: center;
    cursor: pointer; text-decoration: none; display: block;
  }
  .stb-option-title { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; }
  .stb-option-desc { margin: 0; color: #94a3b8; font-size: 0.75rem; line-height: 1.4; }

  .stb-qr-container {
    background: white; border-radius: 20px; padding: 20px;
    display: inline-block;
  }

  .stb-label {
    color: #64748b; font-size: 0.75rem; margin: 0 0 8px;
    text-transform: uppercase; letter-spacing: 2px;
  }
  .stb-code-grid { display: flex; justify-content: center; gap: 6px; }
  .stb-code-char {
    width: 40px; height: 48px; border-radius: 10px;
    background: rgba(20,184,166,0.15); border: 2px solid rgba(20,184,166,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; color: #5eead4; font-family: monospace;
  }

  .stb-timer {
    margin-top: 16px; display: inline-block; padding: 6px 14px;
    border-radius: 8px; font-size: 13px; color: #94a3b8;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  }
  .stb-timer-urgent { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #fca5a5; }

  .stb-waiting {
    margin-top: 12px; display: flex; align-items: center; justify-content: center;
    gap: 8px; color: #94a3b8; font-size: 0.85rem;
  }
  .stb-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #14b8a6;
    animation: stb-blink 1.5s ease-in-out infinite;
  }

  .stb-step-row {
    display: flex; gap: 12px; align-items: center; padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .stb-step-row:last-child { border-bottom: none; }
  .stb-step-num {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    background: rgba(20,184,166,0.15); display: flex; align-items: center; justify-content: center;
    color: #5eead4; font-size: 13px; font-weight: 700;
  }
  .stb-step-text { color: #cbd5e1; font-size: 0.85rem; line-height: 1.4; }

  .stb-btn-outline {
    width: 100%; padding: 10px; background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0;
    border-radius: 10px; font-size: 0.85rem; cursor: pointer;
  }
  .stb-btn-primary {
    width: auto; padding: 10px 20px; background: linear-gradient(135deg, #14b8a6, #0d9488);
    border: none; color: white; border-radius: 10px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer;
  }
  .stb-btn-ghost {
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    color: #e2e8f0; padding: 10px 24px; border-radius: 10px; font-size: 0.9rem; cursor: pointer;
  }

  .stb-input {
    width: 100%; padding: 10px 12px; font-size: 0.85rem;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px; color: white; outline: none;
  }

  .stb-progress-track {
    width: 100%; height: 6px; border-radius: 3px;
    background: rgba(255,255,255,0.1); overflow: hidden;
  }
  .stb-progress-bar {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #14b8a6, #10b981);
    transition: width 1s linear;
  }

  .stb-success-icon {
    width: 100px; height: 100px; border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #10b981);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 48px; margin-bottom: 24px;
  }

  /* Responsive grids */
  .stb-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stb-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

  /* Phone responsive */
  @media (max-width: 640px) {
    .stb-page { padding: 12px; }
    .stb-heading-xl { font-size: 1.4rem; }
    .stb-heading-lg { font-size: 1.2rem; }
    .stb-2col { grid-template-columns: 1fr; }
    .stb-3col { grid-template-columns: 1fr; }
    .stb-primary-action { padding: 20px 16px; }
    .stb-action-title { font-size: 1.1rem; }
    .stb-code-char { width: 36px; height: 42px; font-size: 18px; }
    .stb-qr-container { padding: 16px; }
    .stb-qr-container svg { width: 180px !important; height: 180px !important; }
  }

  /* Tablet */
  @media (min-width: 641px) and (max-width: 1024px) {
    .stb-qr-container svg { width: 200px !important; height: 200px !important; }
  }

  /* TV large screens */
  @media (min-width: 1280px) {
    .stb-heading-xl { font-size: 2.2rem; }
    .stb-heading-lg { font-size: 1.8rem; }
    .stb-code-char { width: 48px; height: 56px; font-size: 24px; }
    .stb-qr-container { padding: 28px; }
    .stb-qr-container svg { width: 260px !important; height: 260px !important; }
    .stb-primary-action { padding: 32px; }
    .stb-action-title { font-size: 1.5rem; }
    .stb-step-text { font-size: 0.95rem; }
  }

  @keyframes stb-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .stb-spinner {
    width: 48px; height: 48px; border: 4px solid rgba(20,184,166,0.2);
    border-top-color: #14b8a6; border-radius: 50%;
    animation: stb-spin 0.8s linear infinite;
  }

  @keyframes stb-spin {
    to { transform: rotate(360deg); }
  }
`;
