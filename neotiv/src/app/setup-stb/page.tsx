'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

type Step = 'loading' | 'qr' | 'paired';

export default function SetupSTBPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [pairingCode, setPairingCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');

  const [pairedRoom, setPairedRoom] = useState('');
  const [pairedHotel, setPairedHotel] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Generate pairing code
  const generateCode = useCallback(async () => {
    setError('');
    setStep('loading');
    try {
      const res = await fetch('/api/stb/generate-code', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate code');
      setPairingCode(data.code);
      setExpiresAt(data.expiresAt);
      setStep('qr');
    } catch (err: any) {
      console.error('QR Generate Error:', err);
      setError(err.message || 'Failed to generate code. Check server connection.');
    }
  }, []);

  // Auto-start on mount
  useEffect(() => {
    setOrigin(window.location.origin);
    generateCode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || step !== 'qr') return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) generateCode();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, step, generateCode]);

  // Poll for pairing
  useEffect(() => {
    if (step !== 'qr' || !pairingCode) return;
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
              hotelSlug: data.hotelSlug, roomCode: data.roomCode,
            }));
          }
          setPairedRoom(data.roomCode);
          setPairedHotel(data.sessionData?.hotelName || data.hotelSlug);
          setRedirectUrl(data.redirectUrl);
          setStep('paired');
        } else if (data.status === 'expired') {
          generateCode();
        }
      } catch { /* retry */ }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => clearInterval(interval);
  }, [step, pairingCode, generateCode]);

  // Redirect after pairing
  useEffect(() => {
    if (step !== 'paired' || !redirectUrl) return;
    const interval = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c <= 1) { clearInterval(interval); router.push(redirectUrl); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, redirectUrl, router]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ═══════════════ PAIRED SUCCESS ═══════════════
  if (step === 'paired') {
    return (
      <div className="stb-page">
        <div className="stb-center">
          <div className="stb-success-icon">✓</div>
          <h1 className="stb-h1">Device Paired!</h1>
          <p className="stb-sub">
            Connected to <span className="stb-highlight">{pairedHotel}</span>
          </p>
          <p className="stb-room">Room {pairedRoom}</p>
          <div className="stb-box" style={{ marginTop: 32 }}>
            <p className="stb-sub" style={{ marginBottom: 12 }}>
              Launching dashboard in {redirectCountdown}s...
            </p>
            <div className="stb-progress-track">
              <div className="stb-progress-bar" style={{ width: `${((5 - redirectCountdown) / 5) * 100}%` }} />
            </div>
          </div>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  // ═══════════════ QR CODE SCREEN ═══════════════
  if (step === 'qr' && pairingCode) {
    const qrValue = `${origin}/stb-pair?code=${pairingCode}`;
    return (
      <div className="stb-page">
        <div className="stb-center">
          {/* QR Code */}
          <div className="stb-qr-wrap">
            <QRCode value={qrValue} size={220} level="H" />
          </div>

          {/* Pairing Code */}
          <div style={{ marginTop: 20 }}>
            <p className="stb-label">PAIRING CODE</p>
            <div className="stb-code-row">
              {pairingCode.split('').map((c, i) => (
                <div key={i} className="stb-code-char">{c}</div>
              ))}
            </div>
          </div>

          {/* Timer + Status */}
          <div className={`stb-timer ${timeLeft < 60 ? 'stb-timer-warn' : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <div className="stb-waiting">
            <div className="stb-dot" />
            Waiting for staff to scan...
          </div>

          {/* Instructions */}
          <div className="stb-box stb-instructions">
            <p className="stb-label" style={{ marginBottom: 12 }}>📱 STAFF: SCAN FROM YOUR PHONE</p>
            {[
              'Open this domain on your phone',
              'Login as Staff → go to Rooms',
              'Select the room → tap "Pair STB"',
              'Enter the code above',
            ].map((t, i) => (
              <div key={i} className="stb-step">
                <div className="stb-step-n">{i + 1}</div>
                <span className="stb-step-t">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  // ═══════════════ LOADING / ERROR ═══════════════
  return (
    <div className="stb-page">
      <div className="stb-center">
        <div className="stb-logo">N</div>
        <h1 className="stb-h1">Neotiv STB Setup</h1>
        {error ? (
          <>
            <div className="stb-error">{error}</div>
            <button onClick={generateCode} className="stb-btn" style={{ marginTop: 16 }}>
              ↻ Try Again
            </button>
          </>
        ) : (
          <>
            <div className="stb-spinner" />
            <p className="stb-sub">Generating pairing code...</p>
          </>
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
    background: #0f172a;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .stb-center { text-align: center; max-width: 500px; width: 100%; }

  .stb-logo {
    width: 56px; height: 56px; border-radius: 14px;
    background: #14b8a6;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 700; margin-bottom: 16px;
  }

  .stb-h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
  .stb-sub { color: #94a3b8; font-size: 0.9rem; }
  .stb-highlight { color: #5eead4; font-weight: 600; }
  .stb-room { font-size: 2.5rem; font-weight: 700; color: #14b8a6; margin-top: 12px; }

  .stb-qr-wrap {
    background: white; border-radius: 16px; padding: 20px;
    display: inline-block;
  }

  .stb-label {
    color: #64748b; font-size: 0.7rem; font-weight: 600;
    letter-spacing: 2px; margin-bottom: 8px;
  }

  .stb-code-row { display: flex; justify-content: center; gap: 6px; }
  .stb-code-char {
    width: 38px; height: 46px; border-radius: 10px;
    background: rgba(20,184,166,0.15); border: 2px solid rgba(20,184,166,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; color: #5eead4; font-family: monospace;
  }

  .stb-timer {
    margin-top: 16px; display: inline-block; padding: 5px 14px;
    border-radius: 6px; font-size: 13px; color: #94a3b8;
    background: rgba(255,255,255,0.05);
  }
  .stb-timer-warn { background: rgba(239,68,68,0.15); color: #fca5a5; }

  .stb-waiting {
    margin-top: 10px; display: flex; align-items: center;
    justify-content: center; gap: 8px; color: #64748b; font-size: 0.8rem;
  }
  .stb-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #14b8a6;
    animation: blink 1.5s ease-in-out infinite;
  }

  .stb-box {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 16px;
  }
  .stb-instructions { margin-top: 24px; text-align: left; }

  .stb-step {
    display: flex; gap: 10px; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .stb-step:last-child { border-bottom: none; }
  .stb-step-n {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    background: rgba(20,184,166,0.15); display: flex; align-items: center;
    justify-content: center; color: #5eead4; font-size: 12px; font-weight: 700;
  }
  .stb-step-t { color: #cbd5e1; font-size: 0.8rem; }

  .stb-error {
    background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px; padding: 12px; color: #fca5a5;
    font-size: 0.85rem; margin-top: 16px;
  }

  .stb-btn {
    padding: 10px 24px; background: #14b8a6; color: white;
    border: none; border-radius: 10px; font-size: 0.9rem;
    font-weight: 600; cursor: pointer;
  }

  .stb-spinner {
    width: 40px; height: 40px; margin: 20px auto;
    border: 3px solid rgba(20,184,166,0.2); border-top-color: #14b8a6;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }

  .stb-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: #14b8a6; display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 36px; margin-bottom: 20px;
  }

  .stb-progress-track {
    width: 100%; height: 5px; border-radius: 3px;
    background: rgba(255,255,255,0.1); overflow: hidden;
  }
  .stb-progress-bar {
    height: 100%; border-radius: 3px; background: #14b8a6;
    transition: width 1s linear;
  }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin { to{transform:rotate(360deg)} }

  @media (max-width: 480px) {
    .stb-h1 { font-size: 1.2rem; }
    .stb-code-char { width: 32px; height: 40px; font-size: 17px; }
    .stb-qr-wrap { padding: 14px; }
    .stb-qr-wrap svg { width: 160px !important; height: 160px !important; }
    .stb-room { font-size: 2rem; }
  }

  @media (min-width: 1280px) {
    .stb-h1 { font-size: 2rem; }
    .stb-code-char { width: 46px; height: 54px; font-size: 22px; }
    .stb-qr-wrap { padding: 28px; }
    .stb-qr-wrap svg { width: 280px !important; height: 280px !important; }
    .stb-step-t { font-size: 0.9rem; }
  }
`;
