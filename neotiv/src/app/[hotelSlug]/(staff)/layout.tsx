'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Building2, MessageSquare, Bell, Clock, ConciergeBell, Ticket, Settings, Bed, Tags, Users, Wrench, BarChart3, LogOut, Home, Menu, X } from 'lucide-react';

const guestOpsNav = [
  { href: 'home', label: 'Home', icon: Home, color: 'text-indigo-400' },
  { href: 'rooms', label: 'Rooms', icon: Building2, color: 'text-blue-400' },
  { href: 'notifications', label: 'Notifications', icon: Bell, color: 'text-amber-400' },
  { href: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-teal-400' },
  { href: 'alarms', label: 'Alarms', icon: Clock, color: 'text-rose-400' },
  { href: 'service-requests', label: 'Service Requests', icon: ConciergeBell, color: 'text-violet-400' },
  { href: 'promos', label: 'Promos', icon: Ticket, color: 'text-pink-400' },
];

const mgmtNav = [
  { href: '/settings', label: 'Hotel Settings', icon: Settings, color: 'text-slate-400' },
  { href: '/settings/rooms', label: 'Rooms Inventory', icon: Bed, color: 'text-slate-400' },
  { href: '/settings/room-types', label: 'Room Types', icon: Tags, color: 'text-slate-400' },
  { href: '/settings/staff', label: 'Staff Management', icon: Users, color: 'text-slate-400' },
  { href: '/settings/services', label: 'Services Config', icon: Wrench, color: 'text-slate-400' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, color: 'text-slate-400' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setStaffName(data.user.user_metadata?.name || data.user.email || 'Staff');
        setIsManager(data.user.user_metadata?.role === 'manager' || data.user.user_metadata?.role === 'superadmin');
      }
    });
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push(`/${hotelSlug}/login`);
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight">Neotiv</h1>
              <p className="text-slate-400 text-xs mt-0.5 capitalize font-medium">{hotelSlug.replace(/-/g, ' ')}</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-5 px-3 overflow-y-auto hide-scrollbar space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Front Desk</p>
          <div className="space-y-1">
            {guestOpsNav.map((item) => {
              const fullPath = `/${hotelSlug}/frontoffice/${item.href}`;
              const active = pathname === fullPath || pathname.startsWith(fullPath + '/');
              const Icon = item.icon;
              return (
                <Link key={item.href} href={fullPath}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <Icon className={`w-4 h-4 ${active ? item.color : 'opacity-70 group-hover:opacity-100'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {isManager && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Management</p>
            <div className="space-y-1">
              {mgmtNav.map((item) => {
                const fullPath = `/${hotelSlug}${item.href}`;
                const active = pathname === fullPath || pathname.startsWith(fullPath + '/');
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={fullPath}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50" style={{ fontFamily: 'var(--font-staff)' }}>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex w-[260px] flex-col shadow-xl z-20 flex-shrink-0" style={{ background: '#0B1120' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          {/* Sidebar drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col shadow-xl" style={{ background: '#0B1120' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[56px] lg:h-[72px] flex-shrink-0 flex items-center justify-between px-4 lg:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm z-10 sticky top-0">
          {/* Mobile menu button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base lg:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 capitalize truncate">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </button>
            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-700 leading-none">{staffName}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{isManager ? 'Manager' : 'Front Desk'}</p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-teal-500/20 border-2 border-white">
                {staffName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
