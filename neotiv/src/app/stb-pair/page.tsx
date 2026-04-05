'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function StbPairContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [code, setCode] = useState(codeFromUrl);
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [step, setStep] = useState<'pair' | 'success'>('pair');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pairedRoom, setPairedRoom] = useState('');
  const [pairedHotel, setPairedHotel] = useState('');

  useEffect(() => {
    const ctx = localStorage.getItem('neotiv_staff_context');
    if (ctx) {
      try {
        const data = JSON.parse(ctx);
        if (data.hotelSlug) setHotelSlug(data.hotelSlug);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl.toUpperCase());
  }, [codeFromUrl]);

  const handlePair = async () => {
    if (!code.trim() || !hotelSlug.trim() || !roomCode.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stb/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          hotelSlug: hotelSlug.trim().toLowerCase(),
          roomCode: roomCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPairedRoom(data.roomCode);
      setPairedHotel(data.hotelName);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to pair device');
    }
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <div className="pair-page">
        <div className="pair-container" style={{ textAlign: 'center' }}>
          <div className="pair-success-icon">✓</div>
          <h1 className="pair-heading">STB Paired!</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 12px' }}>
            <span style={{ color: '#5eead4', fontWeight: 600 }}>{pairedHotel}</span> — Room {pairedRoom}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
            The TV will automatically load the dashboard. You can close this page.
          </p>
          <div className="pair-info-box">
            📺 Check the TV — it should redirect in a few seconds
          </div>
        </div>
        <style>{pairStyles}</style>
      </div>
    );
  }

  return (
    <div className="pair-page">
      <div className="pair-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="pair-logo">N</div>
          <h1 className="pair-heading">Pair STB Device</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Enter the code shown on the TV
          </p>
        </div>

        {/* Pairing Code */}
        <div className="pair-field">
          <label className="pair-label">Pairing Code</label>
          <input type="text" value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123" maxLength={6}
            className="pair-code-input" />
          {codeFromUrl && (
            <p style={{ color: '#5eead4', fontSize: '0.7rem', marginTop: 4, textAlign: 'center' }}>
              ✓ Code auto-filled from QR scan
            </p>
          )}
        </div>

        {/* Hotel + Room */}
        <div className="pair-field">
          <label className="pair-label">Hotel ID</label>
          <input type="text" value={hotelSlug}
            onChange={e => setHotelSlug(e.target.value)}
            placeholder="e.g. amartha-hotel" className="pair-input" />
        </div>
        <div className="pair-field">
          <label className="pair-label">Room Code</label>
          <input type="text" value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
            placeholder="e.g. 101" className="pair-input"
            onKeyDown={e => { if (e.key === 'Enter') handlePair(); }} />
        </div>

        {error && <div className="pair-error">{error}</div>}

        <button onClick={handlePair}
          disabled={loading || !code.trim() || !hotelSlug.trim() || !roomCode.trim()}
          className={`pair-submit ${(code.trim() && hotelSlug.trim() && roomCode.trim()) ? 'pair-submit-active' : ''}`}
        >
          {loading ? '⏳ Pairing...' : '📺 Pair Device'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 12, color: '#475569', fontSize: '0.7rem' }}>
          This connects the TV to the specified room&apos;s dashboard
        </p>
      </div>
      <style>{pairStyles}</style>
    </div>
  );
}

export default function StbPairPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <p>Loading...</p>
      </div>
    }>
      <StbPairContent />
    </Suspense>
  );
}

const pairStyles = `
  * { box-sizing: border-box; }
  
  .pair-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    font-family: system-ui, -apple-system, sans-serif;
    padding: 16px;
  }

  .pair-container {
    max-width: 400px; width: 100%; color: white;
    background: rgba(255,255,255,0.04); border-radius: 20px;
    padding: 24px; border: 1px solid rgba(255,255,255,0.08);
  }

  .pair-logo {
    width: 48px; height: 48px; border-radius: 12px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; margin-bottom: 12px;
  }

  .pair-heading { font-size: 1.4rem; font-weight: 700; margin: 0 0 4px; color: white; }

  .pair-field { margin-bottom: 14px; }
  .pair-label {
    display: block; color: #94a3b8; font-size: 0.75rem;
    font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;
  }

  .pair-code-input {
    width: 100%; padding: 14px 16px; font-size: 1.4rem;
    font-family: monospace; letter-spacing: 6px; text-align: center; font-weight: 700;
    background: rgba(20,184,166,0.1); border: 2px solid rgba(20,184,166,0.3);
    border-radius: 12px; color: #5eead4; outline: none;
  }
  .pair-code-input:focus { border-color: #14b8a6; }

  .pair-input {
    width: 100%; padding: 12px 14px; font-size: 1rem;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px; color: white; outline: none;
  }
  .pair-input:focus { border-color: #14b8a6; }
  .pair-input::placeholder { color: #475569; }

  .pair-error {
    background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;
    color: #fca5a5; font-size: 0.8rem; text-align: center;
  }

  .pair-submit {
    width: 100%; padding: 14px; font-size: 1rem; font-weight: 600;
    background: rgba(255,255,255,0.08); color: #64748b;
    border: none; border-radius: 10px; cursor: pointer;
  }
  .pair-submit-active {
    background: linear-gradient(135deg, #14b8a6, #0d9488); color: white;
  }
  .pair-submit:disabled { opacity: 0.7; }

  .pair-success-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #10b981);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 32px; margin-bottom: 16px; color: white;
  }

  .pair-info-box {
    margin-top: 20px; padding: 14px; background: rgba(20,184,166,0.1);
    border-radius: 10px; border: 1px solid rgba(20,184,166,0.2);
    color: #5eead4; font-size: 0.8rem;
  }

  /* Phone */
  @media (max-width: 480px) {
    .pair-container { padding: 20px 16px; }
    .pair-heading { font-size: 1.2rem; }
    .pair-code-input { font-size: 1.2rem; padding: 12px; letter-spacing: 4px; }
  }
`;
