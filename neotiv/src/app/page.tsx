'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortalPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'guest' | 'staff'>('choose');
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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, var(--color-teal) 0%, transparent 70%)',
            top: '-200px',
            right: '-200px',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            bottom: '-150px',
            left: '-150px',
            animation: 'pulse 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl w-full px-6">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ background: 'var(--color-teal)' }}
            >
              N
            </div>
            <h1
              className="text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Neotiv
            </h1>
          </div>
          <p className="text-slate-400 text-lg mb-10">
            Smart Hospitality Platform
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* CHOOSE MODE */}
          {mode === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Guest Card */}
              <button
                onClick={() => { setMode('guest'); setError(''); }}
                className="group p-8 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(20,184,166,0.15)' }}
                >
                  📺
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Room TV Dashboard
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Access your in-room entertainment, services, and hotel information
                </p>
              </button>

              {/* Staff Card */}
              <button
                onClick={() => { setMode('staff'); setError(''); }}
                className="group p-8 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  🏨
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Hotel Staff Portal
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Front office operations, hotel management, and guest services
                </p>
              </button>
            </motion.div>
          )}

          {/* GUEST MODE */}
          {mode === 'guest' && (
            <motion.div
              key="guest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto"
            >
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => { setMode('choose'); setError(''); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-semibold text-white">
                    Room TV Access
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Hotel ID</label>
                    <input
                      type="text"
                      value={hotelSlug}
                      onChange={(e) => setHotelSlug(e.target.value)}
                      placeholder="e.g. amartha-hotel"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Room Code</label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="e.g. 417"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button
                    onClick={handleGuestGo}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:brightness-110"
                    style={{ background: 'var(--color-teal)' }}
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAFF MODE */}
          {mode === 'staff' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto"
            >
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => { setMode('choose'); setError(''); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-semibold text-white">
                    Staff Login
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Hotel ID</label>
                    <input
                      type="text"
                      value={hotelSlug}
                      onChange={(e) => setHotelSlug(e.target.value)}
                      placeholder="e.g. amartha-hotel"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button
                    onClick={handleStaffGo}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:brightness-110"
                    style={{ background: '#6366f1' }}
                  >
                    Continue to Login
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-600 text-xs mt-12"
        >
          © {new Date().getFullYear()} Neotiv — Smart Hospitality Platform
        </motion.p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
