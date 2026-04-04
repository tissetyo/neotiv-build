'use client';

import { useEffect, useState, useCallback, use } from 'react';
import useSWR from 'swr';
import { useDpadNavigation } from '@/lib/hooks/useDpadNavigation';
import { useRoomStore } from '@/stores/roomStore';
import AnalogClock from '@/components/tv/AnalogClock';
import DigitalClock from '@/components/tv/DigitalClock';
import GuestCard from '@/components/tv/GuestCard';
import WifiCard from '@/components/tv/WifiCard';
import FlightSchedule from '@/components/tv/FlightSchedule';
import NotificationCard from '@/components/tv/NotificationCard';
import HotelDeals from '@/components/tv/HotelDeals';
import HotelService from '@/components/tv/HotelService';
import HotelInfo from '@/components/tv/HotelInfo';
import MapWidget from '@/components/tv/MapWidget';
import MarqueeBar from '@/components/tv/MarqueeBar';
import ChatModal from '@/components/tv/ChatModal';
import AlarmModal from '@/components/tv/AlarmModal';
import AppLauncher from '@/components/tv/AppLauncher';
import ServiceRequestModal from '@/components/tv/ServiceRequestModal';
import ConnectionStatus from '@/components/tv/ConnectionStatus';
import PromoModal from '@/components/tv/PromoModal';
import NotificationsModal from '@/components/tv/NotificationsModal';
import DisplaySettingsModal from '@/components/tv/DisplaySettingsModal';
import GuestLogoutModal from '@/components/tv/GuestLogoutModal';
import { CheckoutWidget, CheckoutModal } from '@/components/tv/CheckoutReminder';
import type { AppConfig } from '@/components/tv/AppLauncher';
import { AlarmClock, MessageCircle, Bell, SlidersHorizontal } from 'lucide-react';

export default function MainDashboardPage({ params }: { params: any }) {
  // Safe unwrap for dynamic params (handles both Promise and direct object for Next.js 15/16 consistency)
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const hotelSlug = resolvedParams?.hotelSlug;
  const roomCode = resolvedParams?.roomCode;

  const store = useRoomStore();
  const hydrate = useRoomStore(s => s.hydrate);
  const currentLayoutConfig = useRoomStore(s => s.tvLayoutConfig);

  const [mounted, setMounted] = useState(false);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [launchApp, setLaunchApp] = useState<AppConfig | null>(null);

  const handleEscape = useCallback(() => {
    setActiveModal(null);
    setLaunchApp(null);
  }, []);

  useDpadNavigation({ enabled: mounted && !activeModal && !launchApp, onEscape: handleEscape });

  // Block right-click context menu on TV dashboard
  useEffect(() => {
    if (!mounted) return;
    const blockContext = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener('contextmenu', blockContext, true);
    return () => { document.removeEventListener('contextmenu', blockContext, true); };
  }, [mounted]);

  const { data: liveConfig } = useSWR(
    mounted ? `/api/hotel/${hotelSlug}/tv-config` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('TV Config Fetch Failed:', errorText);
        return null;
      }
      return res.json();
    },
    { refreshInterval: 60000 } // Check every minute
  );

  // Silent light reload for Notifications and Chat Updates every 60s
  const { data: liveStatus } = useSWR(
    mounted && store.roomId ? `/api/room/${store.roomId}/status?hotelId=${store.hotelId}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    { refreshInterval: 60000 }
  );

  useEffect(() => {
    if (liveConfig) {
      const updates: any = {};
      if (liveConfig.tvLayoutConfig) {
        const incoming = JSON.stringify(liveConfig.tvLayoutConfig);
        const current = JSON.stringify(currentLayoutConfig);
        if (incoming !== current) {
          updates.tvLayoutConfig = liveConfig.tvLayoutConfig;
        }
      }
      if (liveConfig.featuredImageUrl !== undefined && liveConfig.featuredImageUrl !== store.hotelFeaturedImageUrl) {
        updates.hotelFeaturedImageUrl = liveConfig.featuredImageUrl;
      }
      if (Object.keys(updates).length > 0) {
        hydrate(updates);
      }
    }
  }, [liveConfig, currentLayoutConfig, store.hotelFeaturedImageUrl, hydrate]);

  useEffect(() => {
    if (liveStatus) {
      if (liveStatus.unreadChatCount !== store.unreadChatCount) {
        useRoomStore.setState({ unreadChatCount: liveStatus.unreadChatCount });
      }
      if (liveStatus.latestNotification?.id !== store.latestNotification?.id) {
        store.setNotification(liveStatus.latestNotification);
      }
      if (liveStatus.roomDetails) {
        let hasChanges = false;
        const updates: any = {};
        if (liveStatus.roomDetails.guest_name !== store.guestName) { updates.guestName = liveStatus.roomDetails.guest_name; hasChanges = true; }
        if (liveStatus.roomDetails.guest_photo_url !== store.guestPhotoUrl) { updates.guestPhotoUrl = liveStatus.roomDetails.guest_photo_url; hasChanges = true; }
        if (liveStatus.roomDetails.checkout_date !== store.checkoutDate) { updates.checkoutDate = liveStatus.roomDetails.checkout_date; hasChanges = true; }
        
        if (hasChanges) {
          hydrate(updates);
          const stored = localStorage.getItem(`neotiv_room_${hotelSlug}_${roomCode}`);
          if (stored) {
            try {
              const data = JSON.parse(stored);
              // Also sync roomCode if changed (can't change route instantly safely, but we can update data)
              const updatedSession = { ...data, ...updates, 
                roomCode: liveStatus.roomDetails.room_code || data.roomCode,
                welcomeMessage: liveStatus.roomDetails.custom_welcome_message 
              };
              localStorage.setItem(`neotiv_room_${hotelSlug}_${roomCode}`, JSON.stringify(updatedSession));
            } catch {}
          }
        }
      }
    }
  }, [liveStatus, hydrate, hotelSlug, roomCode, store.guestName, store.guestPhotoUrl, store.checkoutDate]);

  useEffect(() => {
    const stored = localStorage.getItem(`neotiv_room_${hotelSlug}_${roomCode}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        store.hydrate({
          roomId: data.roomId,
          hotelId: data.hotelId,
          roomCode: data.roomCode || roomCode,
          hotelSlug,
          guestName: data.guestName || '',
          guestPhotoUrl: data.guestPhotoUrl,
          backgroundUrl: data.backgroundUrl,
          hotelName: data.hotelName || 'Amartha Hotel',
          hotelFeaturedImageUrl: data.hotelFeaturedImageUrl || null,
          hotelTimezone: data.hotelTimezone || 'Asia/Jakarta',
          hotelLocation: data.hotelLocation || 'Kuta, Bali',
          wifiSsid: data.wifiSsid || '',
          wifiPassword: data.wifiPassword || '',
          wifiUsername: data.wifiUsername || '',
          checkoutDate: data.checkoutDate || null,
          clockTimezones: data.clockTimezones || ['America/New_York', 'Europe/Paris', 'Asia/Shanghai'],
          clockLabels: data.clockLabels || ['New York', 'France', 'China'],
          tvDisplayOverrides: data.tvDisplayOverrides || null,
        });
      } catch { /* use defaults */ }
    }
    setMounted(true);
  }, [hotelSlug, roomCode, hydrate]);

  const handleAction = useCallback((action: string) => { setActiveModal(action); }, []);
  const handleLaunchApp = useCallback((app: any) => {
    if (app.name === 'TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }

    if (app.url && !app.url.startsWith('http') && !app.url.startsWith('intent://')) {
      const pkg = app.url.trim();

      // Reliable STB Native App Launch
      if (typeof window !== 'undefined' && (window as any).NeotivNative?.launchExternalApp) {
        (window as any).NeotivNative.launchExternalApp(pkg);
        return;
      }

      // Standard Browser Fallback
      const intentUrl = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LEANBACK_LAUNCHER;package=${pkg};S.browser_fallback_url=market://details?id=${pkg};end;`;
      window.location.href = intentUrl;
      setTimeout(() => {
        window.location.href = `intent://#Intent;package=${pkg};scheme=https;S.browser_fallback_url=https://play.google.com/store/apps/details?id=${pkg};end;`;
      }, 2000);
      return;
    }
    // If it's already a perfectly formatted intent
    if (app.url && app.url.startsWith('intent://')) {
      let intentUrl = app.url;
      // Ensure it has fallback URL
      if (!intentUrl.includes('S.browser_fallback_url')) {
        const pkgMatch = intentUrl.match(/package=([^;]+)/);
        if (pkgMatch) {
          intentUrl = intentUrl.replace(';end;', `;S.browser_fallback_url=market://details?id=${pkgMatch[1]};end;`);
        }
      }
      window.location.href = intentUrl;
      return;
    }

    setLaunchApp({ 
      name: app.name, 
      url: app.url, 
      embeddable: app.embeddable || false, 
      icon: typeof app.icon === 'string' ? app.icon : '' 
    });
  }, []);

  const isCheckoutDay = store.checkoutDate 
    ? new Date(`${store.checkoutDate}T00:00:00`).toDateString() === new Date().toDateString() 
    : false;

  if (!mounted) return <div className="w-screen h-screen bg-slate-900" />;

  const bgUrl = (store.tvLayoutConfig as any)?.theme?.bgUrl || store.backgroundUrl || '/bg-ocean.png';

  const defaultConfig = {
    theme: { opacityLight: 0.82, opacityDark: 0.60 },
    apps: [],
    layout: {
      analogClocks: { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2, visible: true },
      flightSchedule: { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 5, visible: true },
      hotelDeals: { colStart: 1, colSpan: 3, rowStart: 8, rowSpan: 5, visible: true },
      digitalClock: { colStart: 4, colSpan: 5, rowStart: 1, rowSpan: 2, visible: true },
      mapWidget: { colStart: 4, colSpan: 2, rowStart: 8, rowSpan: 5, visible: true },
      guestCard: { colStart: 9, colSpan: 3, rowStart: 1, rowSpan: 2, visible: true },
      wifiCard: { colStart: 9, colSpan: 3, rowStart: 3, rowSpan: 2, visible: true },
      notificationCard: { colStart: 9, colSpan: 3, rowStart: 5, rowSpan: 3, visible: true },
      hotelService: { colStart: 9, colSpan: 3, rowStart: 8, rowSpan: 3, visible: true },
      hotelInfo: { colStart: 9, colSpan: 3, rowStart: 11, rowSpan: 2, visible: true },
      alarmWidget: { colStart: 12, colSpan: 1, rowStart: 1, rowSpan: 1, visible: true, bgColor: '#f59e0b' },
      chatWidget: { colStart: 12, colSpan: 1, rowStart: 2, rowSpan: 1, visible: true, bgColor: '#14b8a6' },
      notifWidget: { colStart: 12, colSpan: 1, rowStart: 3, rowSpan: 1, visible: true, bgColor: '#8b5cf6' },
      displayWidget: { colStart: 12, colSpan: 1, rowStart: 4, rowSpan: 1, visible: true, bgColor: '#6366f1' }
    }
  };
  const config = (store.tvLayoutConfig && typeof store.tvLayoutConfig === 'object' ? store.tvLayoutConfig : defaultConfig) as any;
  
  // Safe widget style getter with strict validation
  const getWidgetStyle = (key: string, baseDelay: string) => {
    try {
      const dbW = config.layout?.[key];
      const defW = (defaultConfig.layout as any)[key];
      
      // Merge: prefer DB values but require they are numbers > 0
      const colStart = typeof dbW?.colStart === 'number' && dbW.colStart > 0 ? dbW.colStart : (defW?.colStart || 1);
      const colSpan = typeof dbW?.colSpan === 'number' && dbW.colSpan > 0 ? dbW.colSpan : (defW?.colSpan || 1);
      const rowStart = typeof dbW?.rowStart === 'number' && dbW.rowStart > 0 ? dbW.rowStart : (defW?.rowStart || 1);
      const rowSpan = typeof dbW?.rowSpan === 'number' && dbW.rowSpan > 0 ? dbW.rowSpan : (defW?.rowSpan || 1);
      const bgColor = dbW?.bgColor;
      const bgOpacity = dbW?.bgOpacity !== undefined ? dbW.bgOpacity : 0.6;
      const textColor = dbW?.textColor || '#ffffff';

      let finalBgColor = '';
      if (bgColor) {
        const hex = bgColor.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          finalBgColor = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;
        } else {
          finalBgColor = `${bgColor}99`; // Fallback legacy
        }
      }

      return {
        gridColumn: `${colStart} / span ${colSpan}`,
        gridRow: `${rowStart} / span ${rowSpan}`,
        animationDelay: baseDelay,
        color: textColor,
        ...(finalBgColor ? { '--widget-bg': finalBgColor } : {})
      } as React.CSSProperties;
    } catch (err) {
      console.error(`Layout Error for ${key}:`, err);
      return { animationDelay: baseDelay };
    }
  };

  // Display filter from config + local room overrides
  const overrides = store.tvDisplayOverrides || {};
  const brightness = overrides.brightness ?? config.theme?.brightness ?? 1;
  const contrast = overrides.contrast ?? config.theme?.contrast ?? 1;
  const saturate = overrides.saturate ?? config.theme?.saturate ?? 1;
  const scale = overrides.scale ?? config.theme?.scale ?? 1;
  const displayFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
      <div className="w-screen h-screen relative overflow-hidden bg-slate-900 tv-kiosk-mode"
        style={{ 
          '--widget-dark-opacity': config.theme?.opacityDark ?? 0.60,
          '--widget-light-opacity': config.theme?.opacityLight ?? 0.82,
          '--focus-color': config.theme?.focusColor ?? '#14b8a6',
          '--focus-style': config.theme?.focusStyle ?? 'outline'
        } as React.CSSProperties}>

      {/* ===== BACKGROUND IMAGE ===== */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: `url(${bgUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: displayFilter,
          transition: 'filter 0.3s ease-in-out'
        }} 
      />

      {/* ===== SCALABLE CONTENT WRAPPER FOR OVERSCAN/RATIO CONTROL ===== */}
      <div className="absolute inset-0 transition-transform duration-300 pointer-events-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div className="w-full h-full relative pointer-events-auto">

      {/* ===== BENTO GRID — matches reference layout ===== */}
      <div className="absolute inset-0 grid gap-[0.6vw]" style={{
        zIndex: 1,
        padding: '1.2vw 1.2vw 3vw 1.2vw',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(12, 1fr)',
      }}>

        {/* ================= LEFT COLUMN ================= */}
        {/* ROW 1-2: Analog Clocks */}
        {config.layout?.analogClocks?.visible !== false && store.clockTimezones?.length >= 3 && (
          <div className="tv-widget flex items-center justify-around widget-animate tv-focusable" tabIndex={0} style={getWidgetStyle('analogClocks', '0ms')}>
            <AnalogClock timezone={store.clockTimezones[0]} label={store.clockLabels[0]} size={100} clockStyle={config.theme?.clockStyle} />
            <AnalogClock timezone={store.clockTimezones[1]} label={store.clockLabels[1]} size={100} clockStyle={config.theme?.clockStyle} />
            <AnalogClock timezone={store.clockTimezones[2]} label={store.clockLabels[2]} size={100} clockStyle={config.theme?.clockStyle} />
          </div>
        )}

        {/* ROW 3-7: Flight Schedule */}
        {config.layout?.flightSchedule?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('flightSchedule', '150ms')}>
            <FlightSchedule />
          </div>
        )}

        {/* ROW 8-12: Hotel Deals */}
        {config.layout?.hotelDeals?.visible !== false && (
          <div className="widget-animate overflow-hidden" style={getWidgetStyle('hotelDeals', '300ms')}>
            <HotelDeals onOpenPromos={() => setActiveModal('promos')} />
          </div>
        )}


        {/* ================= CENTER COLUMN ================= */}
        {/* ROW 1-2: Digital Clock */}
        {config.layout?.digitalClock?.visible !== false && (
          <div className="flex flex-col justify-center items-center tv-text-shadow widget-animate" style={getWidgetStyle('digitalClock', '50ms')}>
            <DigitalClock timezone={store.hotelTimezone} location={store.hotelLocation} />
          </div>
        )}

        {/* ROW 3-7: Open Background */}
        <div className="pointer-events-none" style={{ gridColumn: '4 / span 5', gridRow: '3 / span 5' }} />

        {/* ROW 8-12: Map Widget */}
        {config.layout?.mapWidget?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('mapWidget', '400ms')}>
            <MapWidget location={store.hotelLocation} hotelName={store.hotelName} />
          </div>
        )}

        {/* INDEPENDENT APP CARDS */}
        {config.apps?.map((app: any, i: number) => {
          const layoutKey = `app-${app.id}`;
          if (config.layout?.[layoutKey]?.visible === false) return null;
          
          return (
            <button 
              key={app.id || i}
              onClick={() => handleLaunchApp(app)}
              className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group relative overflow-hidden widget-animate"
              style={{ 
                ...getWidgetStyle(layoutKey, `${450 + i * 50}ms`),
                '--app-color': app.brandColor || '#334155',
              } as unknown as React.CSSProperties}
              tabIndex={0}>
                <div className="mb-[0.8vh] group-hover:scale-110 transition-transform duration-300 relative z-10 flex items-center justify-center"
                     style={{ 
                       width: `${3.5 * (app.iconScale || 1)}vw`, 
                       height: `${3.5 * (app.iconScale || 1)}vw`, 
                       color: app.brandColor || '#e2e8f0' 
                     }}>
                   {app.icon && typeof app.icon === 'string' && (app.icon.startsWith('/') || app.icon.startsWith('http')) ? (
                      <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                   ) : null}
                </div>
                <span className="text-[1vw] font-bold tracking-wide relative z-10 truncate px-2 w-full text-center">{app.name}</span>
                {app.subtitle && (
                  <span className="text-[0.5vw] opacity-40 mt-[0.1vh] relative z-10">{app.subtitle}</span>
                )}
            </button>
          );
        })}


        {/* ================= RIGHT COLUMN ================= */}
        {/* ROW 1-2: Guest Card or Checkout Reminder */}
        {config.layout?.guestCard?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('guestCard', '100ms')}>
             {isCheckoutDay ? (
               <CheckoutWidget onOpenModal={() => setActiveModal('checkout-reminder')} />
             ) : (
               <GuestCard guestName={store.guestName} guestPhotoUrl={store.guestPhotoUrl} roomCode={roomCode} onClick={() => setActiveModal('logout')} />
             )}
          </div>
        )}

        {/* ROW 3-4: WiFi Card */}
        {config.layout?.wifiCard?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('wifiCard', '200ms')}>
            <WifiCard ssid={store.wifiSsid} username={store.wifiUsername} password={store.wifiPassword} />
          </div>
        )}

        {/* ROW 5-7: Notification Card */}
        {config.layout?.notificationCard?.visible !== false && store.latestNotification && !store.latestNotification.is_dismissed && (
          <div className="widget-animate" style={getWidgetStyle('notificationCard', '250ms')}>
            <NotificationCard />
          </div>
        )}

        {/* ROW 8-10: Hotel Service */}
        {config.layout?.hotelService?.visible !== false && (
          <div className="widget-animate flex flex-col" style={getWidgetStyle('hotelService', '350ms')}>
            <HotelService onOpenServices={() => setActiveModal('services')} />
          </div>
        )}

        {/* ROW 11-12: Hotel Info */}
        {config.layout?.hotelInfo?.visible !== false && (
          <div className="widget-animate flex flex-col" style={getWidgetStyle('hotelInfo', '375ms')}>
            <HotelInfo hotelName={store.hotelName} featuredImageUrl={store.hotelFeaturedImageUrl} />
          </div>
        )}


        {/* ================= UTILITY WIDGETS ================= */}
        {config.layout?.alarmWidget?.visible !== false && (
          <button 
            onClick={() => handleAction('alarm')}
            className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group relative overflow-hidden widget-animate"
            style={getWidgetStyle('alarmWidget', '500ms') as React.CSSProperties}
            tabIndex={0}
          >
            <AlarmClock size={20} className="group-hover:scale-110 transition-transform text-white/90" strokeWidth={2.5} />
            <span className="text-[0.6vw] font-semibold mt-1">Alarm</span>
          </button>
        )}

        {config.layout?.chatWidget?.visible !== false && (
          <button 
            onClick={() => handleAction('chat')}
            className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group relative overflow-hidden widget-animate"
            style={getWidgetStyle('chatWidget', '550ms') as React.CSSProperties}
            tabIndex={0}
          >
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform text-white/90" strokeWidth={2.5} />
            <span className="text-[0.6vw] font-semibold mt-1">Chat</span>
            {store.unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[0.5vw] w-[1vw] h-[1vw] rounded-full flex items-center justify-center font-bold">
                {store.unreadChatCount}
              </span>
            )}
          </button>
        )}

        {config.layout?.notifWidget?.visible !== false && (
          <button 
            onClick={() => handleAction('notif')}
            className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group relative overflow-hidden widget-animate"
            style={getWidgetStyle('notifWidget', '600ms') as React.CSSProperties}
            tabIndex={0}
          >
            <Bell size={20} className="group-hover:scale-110 transition-transform text-white/90" strokeWidth={2.5} />
            <span className="text-[0.6vw] font-semibold mt-1">Notifs</span>
          </button>
        )}

        {/* Display Settings Widget */}
        {config.layout?.displayWidget?.visible !== false && (
          <button 
            onClick={() => handleAction('display')}
            className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group relative overflow-hidden widget-animate"
            style={getWidgetStyle('displayWidget', '650ms') as React.CSSProperties}
            tabIndex={0}
          >
            <SlidersHorizontal size={20} className="group-hover:scale-110 transition-transform text-white/90" strokeWidth={2.5} />
            <span className="text-[0.6vw] font-semibold mt-1">Display</span>
          </button>
        )}
      </div>

      {/* ===== MARQUEE BAR ===== */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.2vw] z-10 flex items-center widget-animate"
        style={{ animationDelay: '700ms', background: 'rgba(15, 23, 42, 0.75)' }}>
        <MarqueeBar />
      </div>

        </div>
      </div>

      {/* Modals */}
      <ChatModal isOpen={activeModal === 'chat'} onClose={() => setActiveModal(null)} />
      <CheckoutModal isOpen={activeModal === 'checkout-reminder'} onClose={() => setActiveModal(null)} />
      <AlarmModal isOpen={activeModal === 'alarm'} onClose={() => setActiveModal(null)} />
      <NotificationsModal isOpen={activeModal === 'notif'} onClose={() => setActiveModal(null)} />
      <PromoModal isOpen={activeModal === 'promos'} onClose={() => setActiveModal(null)} />
      <GuestLogoutModal isOpen={activeModal === 'logout'} onClose={() => setActiveModal(null)} />
      <AppLauncher app={launchApp} isOpen={!!launchApp} onClose={() => setLaunchApp(null)} />
      <ServiceRequestModal
        isOpen={activeModal === 'services'}
        onClose={() => setActiveModal(null)}
        onOrderComplete={() => setActiveModal('chat')}
      />
      <DisplaySettingsModal isOpen={activeModal === 'display'} onClose={() => setActiveModal(null)} />
      <ConnectionStatus />
    </div>
  );
}
