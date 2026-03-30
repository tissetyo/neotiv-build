'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin/hotels', label: 'Hotels', icon: '🏨' },
  { href: '/admin/accounts', label: 'Accounts', icon: '👤' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/monitor', label: 'Monitor', icon: '📊' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen" style={{ fontFamily: 'var(--font-staff)', background: '#f8fafc' }}>
      <aside className="w-[260px] flex flex-col" style={{ background: '#0a0f1a' }}>
        <div className="p-5 border-b border-white/10">
          <h1 className="text-white text-xl font-bold">Neotiv</h1>
          <p className="text-rose-400 text-sm mt-0.5 font-medium">Super Admin</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? 'text-white bg-white/10 border-l-4 border-rose-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">← Logout</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[60px] flex items-center justify-between px-6 bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-slate-800 capitalize">{pathname.split('/').pop()?.replace(/-/g, ' ')}</h2>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">A</div>
            <span className="text-sm text-slate-600">Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
