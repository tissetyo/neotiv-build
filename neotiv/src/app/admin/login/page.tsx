'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message || 'Login failed');
      setLoading(false);
      return;
    }

    if (data.user.user_metadata?.role !== 'superadmin') {
      setError('Access denied — superadmin only');
      setLoading(false);
      return;
    }

    router.push('/admin');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1a', fontFamily: 'var(--font-staff)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Neotiv</h1>
          <p className="text-rose-400 mt-1 text-sm font-medium">Super Admin</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-rose-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-rose-400 focus:outline-none" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ background: loading ? '#9f1239' : '#f43f5e' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
