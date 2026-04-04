'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionData {
  roomId: string;
  hotelId: string;
  roomCode: string;
  guestName: string;
  guestPhotoUrl: string | null;
  backgroundUrl: string | null;
  hotelName: string;
  hotelFeaturedImageUrl: string | null;
  hotelTimezone: string;
  hotelLocation: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiUsername: string;
  checkoutDate: string | null;
  welcomeMessage: string | null;
  tvLayoutConfig?: any;
}

export default function RoomDashboardPage({ params }: { params: Promise<{ hotelSlug: string; roomCode: string }> }) {
  const { hotelSlug, roomCode } = use(params);
  const [screen, setScreen] = useState<'pin' | 'welcome'>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  // Check existing session
  useEffect(() => {
    const stored = localStorage.getItem(`neotiv_room_${hotelSlug}_${roomCode}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSession(data);
        setScreen('welcome');
      } catch { /* invalid session */ }
    }
  }, [hotelSlug, roomCode]);

  // Welcome screen countdown
  useEffect(() => {
    if (screen !== 'welcome') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push(`/${hotelSlug}/dashboard/${roomCode}/main`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, hotelSlug, roomCode, router]);

  // D-pad Enter skips to dashboard
  useEffect(() => {
    if (screen !== 'welcome') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') router.push(`/${hotelSlug}/dashboard/${roomCode}/main`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, hotelSlug, roomCode, router]);

  // D-pad keyboard nav for PIN keypad
  useEffect(() => {
    if (screen !== 'pin') return;
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    const handler = (e: KeyboardEvent) => {
      // Number keys directly input
      if (/^[0-9]$/.test(e.key)) { handlePinInput(e.key); return; }
      if (e.key === 'Backspace') { handleBackspace(); return; }
      // Arrow keys navigate between buttons
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const focused = document.activeElement as HTMLElement;
      const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-pin-key]'));
      const idx = btns.indexOf(focused);
      if (idx === -1) { btns[0]?.focus(); return; }
      let next = idx;
      if (e.key === 'ArrowRight') next = Math.min(idx + 1, btns.length - 1);
      if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
      if (e.key === 'ArrowDown') next = Math.min(idx + 3, btns.length - 1);
      if (e.key === 'ArrowUp') next = Math.max(idx - 3, 0);
      btns[next]?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, pin]);

  const handlePinInput = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) submitPin(newPin);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const submitPin = async (enteredPin: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelSlug, roomCode, pin: enteredPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid PIN');
        setPin('');
        setLoading(false);
        return;
      }
      localStorage.setItem(`neotiv_room_${hotelSlug}_${roomCode}`, JSON.stringify(data));
      setSession(data);
      setScreen('welcome');
    } catch {
      setError('Connection error');
      setPin('');
    }
    setLoading(false);
  };

  // Auto focus PIN keypad for TV remote
  useEffect(() => {
    if (screen === 'pin') {
      const focusFn = () => {
        const btn5 = document.querySelector<HTMLElement>('[data-pin-key="5"]');
        if (btn5 && !document.activeElement?.hasAttribute('data-pin-key')) btn5.focus();
      };
      focusFn();
      const t1 = setTimeout(focusFn, 300);
      const t2 = setTimeout(focusFn, 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [screen]);

  const bgUrl = session?.tvLayoutConfig?.theme?.bgUrl || session?.backgroundUrl || '/bg-ocean.png';

  // PIN ENTRY SCREEN
  if (screen === 'pin') {
    return (
      <div className="w-screen h-screen relative overflow-hidden flex items-center justify-center"
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'var(--font-body)' }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
          className="relative z-10 glass-card p-8 md:p-12 w-[90vw] max-w-[420px] text-center text-white">
          <h2 className="text-[28px] font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Neotiv</h2>
          <p className="text-white/60 text-[18px] mb-8">Room {roomCode}</p>
          <p className="text-[20px] mb-6">Enter PIN</p>
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-teal-400' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
              <button key={key} disabled={!key || loading}
                data-pin-key={key || undefined}
                onClick={() => key === '⌫' ? handleBackspace() : key ? handlePinInput(key) : null}
                className={`h-[56px] rounded-xl text-[22px] font-medium transition-colors ${key ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white tv-focusable' : ''}`}
                tabIndex={key ? 0 : -1}>
                {key}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 mt-4">{error}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // WELCOME SCREEN (Frame 3)
  return (
    <div className="w-screen h-screen relative overflow-hidden"
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'var(--font-body)' }}>

      {/* Room number top-right */}
      <div className="absolute top-8 right-10 text-white text-right z-10">
        <p className="text-[18px] font-medium tracking-wider">Room</p>
        <p className="text-[56px] font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{roomCode}</p>
      </div>

      {/* Centered welcome card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative">
          {/* Avatar — only show when guest data exists */}
          {session?.guestName && (
            <div className="absolute -top-14 left-8 z-20">
              <div className="w-[100px] h-[100px] rounded-full border-4 border-white/40 overflow-hidden">
                {session?.guestPhotoUrl ? (
                  <img src={session.guestPhotoUrl} alt="Guest" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-[36px] font-bold">
                    {session.guestName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card */}
          <div className={`glass-card px-16 pb-12 w-[560px] ${session?.guestName ? 'pt-16' : 'pt-12'}`}>
            <p className="text-white/80 text-[22px]">
              Welcome{session?.guestName ? ` in ${session?.hotelName || 'our Hotel'}` : ''}!
            </p>
            {session?.guestName && (
              <p className="text-white text-[26px] font-bold mt-1">{session.guestName}</p>
            )}
            <div className="w-full h-[1px] bg-white/20 my-6" />
            <p className="text-white/70 text-[18px] leading-relaxed">
              {session?.welcomeMessage || "We hope you enjoy your stay! We are always ready whenever you need us."}
            </p>
            <p className="text-white/80 text-[18px] mt-4 font-medium">Your comfort is our priority!</p>

            {/* Progress bar */}
            <div className="mt-6 w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${((5 - countdown) / 5) * 100}%`,
                  background: 'var(--color-teal)',
                }}
              />
            </div>
            <p className="text-white/40 text-[14px] mt-2">Press Enter to skip • {countdown}s</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
