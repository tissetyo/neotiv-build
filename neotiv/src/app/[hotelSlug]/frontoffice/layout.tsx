'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

const guestOpsNav = [
  { href: 'rooms', label: 'Rooms', icon: '🏠' },
  { href: 'notifications', label: 'Notifications', icon: '🔔' },
  { href: 'chat', label: 'Chat', icon: '💬' },
  { href: 'alarms', label: 'Alarms', icon: '⏰' },
  { href: 'service-requests', label: 'Service Requests', icon: '🛎' },
  { href: 'promos', label: 'Promos', icon: '🎟' },
];

const mgmtNav = [
  { href: '/settings', label: 'Hotel Settings', icon: '⚙️' },
  { href: '/settings/rooms', label: 'Rooms', icon: '🛏' },
  { href: '/settings/room-types', label: 'Room Types', icon: '🏷' },
  { href: '/settings/staff', label: 'Staff', icon: '👥' },
  { href: '/settings/services', label: 'Services Config', icon: '🔧' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
];

export default function FrontofficeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelSlug: string }>;
}) {
  const { hotelSlug } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const [staffName, setStaffName] = useState('Staff');
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setStaffName(data.user.user_metadata?.name || data.user.email || 'Staff');
        setIsManager(data.user.user_metadata?.role === 'manager' || data.user.user_metadata?.role === 'superadmin');
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push(`/${hotelSlug}/login`);
  };

  return (
    <div className="flex h-screen" style={{ fontFamily: 'var(--font-staff)', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="w-[260px] flex flex-col" style={{ background: 'var(--color-sidebar-bg)' }}>
        <div className="p-5 border-b border-white/10">
          <h1 className="text-white text-xl font-bold">Neotiv</h1>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">{hotelSlug.replace(/-/g, ' ')}</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-5 text-xs text-slate-500 uppercase tracking-wider mb-2">Guest Operations</p>
          {guestOpsNav.map((item) => {
            const fullPath = `/${hotelSlug}/frontoffice/${item.href}`;
            const active = pathname === fullPath || pathname.startsWith(fullPath + '/');
            return (
              <Link key={item.href} href={fullPath}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? 'sidebar-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isManager && (
            <>
              <p className="px-5 text-xs text-slate-500 uppercase tracking-wider mt-6 mb-2">Hotel Management</p>
              {mgmtNav.map((item) => {
                const fullPath = `/${hotelSlug}${item.href}`;
                const active = pathname === fullPath || pathname.startsWith(fullPath + '/');
                return (
                  <Link key={item.href} href={fullPath}
                    className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? 'sidebar-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            ← Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="h-[60px] flex items-center justify-between px-6 bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative text-slate-600 hover:text-slate-800">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                {staffName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-600">{staffName}</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
