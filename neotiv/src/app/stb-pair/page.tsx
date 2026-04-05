'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function StbPairContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [code, setCode] = useState(codeFromUrl);
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [step, setStep] = useState<'auth' | 'pair' | 'success'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pairedRoom, setPairedRoom] = useState('');
  const [pairedHotel, setPairedHotel] = useState('');

  // Check if user is already logged in (has hotel context)
  useEffect(() => {
    // Check localStorage for any recent staff session slug
    const stbSetup = localStorage.getItem('neotiv_staff_context');
    if (stbSetup) {
      try {
        const data = JSON.parse(stbSetup);
        if (data.hotelSlug) setHotelSlug(data.hotelSlug);
      } catch {}
    }
  }, []);

  // Pre-fill code from URL
  useEffect(() => {
    if (codeFromUrl) {
      setCode(codeFromUrl.toUpperCase());
      setStep('pair');
    }
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

  // ═══════════════════════════════════════
  // SUCCESS
  // ═══════════════════════════════════════
  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #14b8a6, #10b981)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 24,
          }}>✓</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px' }}>STB Paired!</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 16px' }}>
            <span style={{ color: '#5eead4', fontWeight: 600 }}>{pairedHotel}</span> — Room {pairedRoom}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            The TV will automatically load the dashboard. You can close this page.
          </p>
          <div style={{
            marginTop: 24, padding: 16, background: 'rgba(20, 184, 166, 0.1)',
            borderRadius: 12, border: '1px solid rgba(20, 184, 166, 0.2)',
          }}>
            <p style={{ color: '#5eead4', fontSize: '0.85rem', margin: 0 }}>
              📺 Check the TV — it should redirect in a few seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // PAIR FORM
  // ═══════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 24,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: 420, width: '100%', color: 'white',
        background: 'rgba(255,255,255,0.04)', borderRadius: 24,
        padding: '2rem', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, marginBottom: 16,
          }}>N</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px' }}>Pair STB Device</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Enter the code shown on the TV
          </p>
        </div>

        {/* Pairing Code (pre-filled from QR) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Pairing Code
          </label>
          <input
            type="text" value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            style={{
              width: '100%', padding: '14px 16px', fontSize: '1.5rem',
              fontFamily: 'monospace', letterSpacing: 8, textAlign: 'center',
              fontWeight: 700,
              background: 'rgba(20, 184, 166, 0.1)', border: '2px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 14, color: '#5eead4', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {codeFromUrl && (
            <p style={{ color: '#5eead4', fontSize: '0.75rem', marginTop: 6, textAlign: 'center' }}>
              ✓ Code auto-filled from QR scan
            </p>
          )}
        </div>

        {/* Hotel + Room */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Hotel ID
          </label>
          <input
            type="text" value={hotelSlug}
            onChange={e => setHotelSlug(e.target.value)}
            placeholder="e.g. amartha-hotel"
            style={{
              width: '100%', padding: '12px 14px', fontSize: '1rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: 'white', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Room Code
          </label>
          <input
            type="text" value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
            placeholder="e.g. 101"
            style={{
              width: '100%', padding: '12px 14px', fontSize: '1rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: 'white', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#fca5a5', fontSize: '0.85rem', textAlign: 'center',
          }}>{error}</div>
        )}

        <button
          onClick={handlePair}
          disabled={loading || !code.trim() || !hotelSlug.trim() || !roomCode.trim()}
          style={{
            width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 600,
            background: (code.trim() && hotelSlug.trim() && roomCode.trim())
              ? 'linear-gradient(135deg, #14b8a6, #0d9488)' : 'rgba(255,255,255,0.08)',
            color: (code.trim() && hotelSlug.trim() && roomCode.trim()) ? 'white' : '#64748b',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '⏳ Pairing...' : '📺 Pair Device'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#475569', fontSize: '0.75rem' }}>
          This connects the TV to the specified room's dashboard
        </p>
      </div>
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
