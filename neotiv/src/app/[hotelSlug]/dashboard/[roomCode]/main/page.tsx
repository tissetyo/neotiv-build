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
import AppGrid from '@/components/tv/AppGrid';
import UtilitySidebar from '@/components/tv/UtilitySidebar';
import MarqueeBar from '@/components/tv/MarqueeBar';
import ChatModal from '@/components/tv/ChatModal';
import AlarmModal from '@/components/tv/AlarmModal';
import AppLauncher from '@/components/tv/AppLauncher';
import ServiceRequestModal from '@/components/tv/ServiceRequestModal';
import ConnectionStatus from '@/components/tv/ConnectionStatus';
import type { AppConfig } from '@/components/tv/AppLauncher';

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
  const [requestService, setRequestService] = useState<{ id: string; name: string; icon: string | null } | null>(null);

  const handleEscape = useCallback(() => {
    setActiveModal(null);
    setLaunchApp(null);
    setRequestService(null);
  }, []);

  useDpadNavigation({ enabled: mounted && !activeModal && !launchApp && !requestService, onEscape: handleEscape });

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

  useEffect(() => {
    if (liveConfig?.tvLayoutConfig) {
      const incoming = JSON.stringify(liveConfig.tvLayoutConfig);
      const current = JSON.stringify(currentLayoutConfig);
      if (incoming !== current) {
        hydrate({ tvLayoutConfig: liveConfig.tvLayoutConfig });
      }
    }
  }, [liveConfig, currentLayoutConfig, hydrate]);

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
          guestName: data.guestName || 'Stephen Hawk',
          guestPhotoUrl: data.guestPhotoUrl,
          backgroundUrl: data.backgroundUrl,
          hotelName: data.hotelName || 'Amartha Hotel',
          hotelTimezone: data.hotelTimezone || 'Asia/Jakarta',
          hotelLocation: data.hotelLocation || 'Kuta, Bali',
          wifiSsid: data.wifiSsid || 'HotelABC',
          wifiPassword: data.wifiPassword || 'stayinhereforwhile',
          wifiUsername: data.wifiUsername || 'Guest',
          clockTimezones: data.clockTimezones || ['America/New_York', 'Europe/Paris', 'Asia/Shanghai'],
          clockLabels: data.clockLabels || ['New York', 'France', 'China'],
        });
      } catch { /* use defaults */ }
    }
    setMounted(true);
  }, [hotelSlug, roomCode, hydrate]);

  const handleAction = useCallback((action: string) => { setActiveModal(action); }, []);
  const handleLaunchApp = useCallback((app: AppConfig) => { setLaunchApp(app); }, []);
  const handleServiceRequest = useCallback((service: { id: string; name: string; icon: string | null }) => { setRequestService(service); }, []);

  if (!mounted) return <div className="w-screen h-screen bg-slate-900" />;

  const bgUrl = store.backgroundUrl || '/bg-ocean.png';

  const defaultConfig = {
    theme: { opacityLight: 0.82, opacityDark: 0.60 },
    apps: [],
    layout: {
      analogClocks: { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2, visible: true },
      flightSchedule: { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 5, visible: true },
      hotelDeals: { colStart: 1, colSpan: 3, rowStart: 8, rowSpan: 5, visible: true },
      digitalClock: { colStart: 4, colSpan: 5, rowStart: 1, rowSpan: 2, visible: true },
      mapWidget: { colStart: 4, colSpan: 2, rowStart: 8, rowSpan: 5, visible: true },
      appGrid: { colStart: 6, colSpan: 3, rowStart: 8, rowSpan: 5, visible: true },
      guestCard: { colStart: 9, colSpan: 3, rowStart: 1, rowSpan: 2, visible: true },
      wifiCard: { colStart: 9, colSpan: 3, rowStart: 3, rowSpan: 2, visible: true },
      notificationCard: { colStart: 9, colSpan: 3, rowStart: 5, rowSpan: 3, visible: true },
      hotelService: { colStart: 9, colSpan: 3, rowStart: 8, rowSpan: 3, visible: true },
      hotelInfo: { colStart: 9, colSpan: 3, rowStart: 11, rowSpan: 2, visible: true }
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

      return {
        gridColumn: `${colStart} / span ${colSpan}`,
        gridRow: `${rowStart} / span ${rowSpan}`,
        animationDelay: baseDelay,
      };
    } catch (err) {
      console.error(`Layout Error for ${key}:`, err);
      return { animationDelay: baseDelay };
    }
  };

  return (
      <div className="w-screen h-screen relative overflow-hidden bg-slate-900"
        style={{ 
          backgroundImage: `url(${bgUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          '--widget-dark-opacity': config.theme?.opacityDark ?? 0.60,
          '--widget-light-opacity': config.theme?.opacityLight ?? 0.82
        } as React.CSSProperties}>

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
            <AnalogClock timezone={store.clockTimezones[0]} label={store.clockLabels[0]} size={85} />
            <AnalogClock timezone={store.clockTimezones[1]} label={store.clockLabels[1]} size={105} />
            <AnalogClock timezone={store.clockTimezones[2]} label={store.clockLabels[2]} size={85} />
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
            <HotelDeals />
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

        {/* ROW 8-12: Map & App Grid */}
        {config.layout?.mapWidget?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('mapWidget', '400ms')}>
            <MapWidget location={store.hotelLocation} hotelName={store.hotelName} />
          </div>
        )}
        {config.layout?.appGrid?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('appGrid', '450ms')}>
            <AppGrid onLaunchApp={handleLaunchApp} />
          </div>
        )}


        {/* ================= RIGHT COLUMN ================= */}
        {/* ROW 1-2: Guest Card */}
        {config.layout?.guestCard?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('guestCard', '100ms')}>
            <GuestCard guestName={store.guestName} guestPhotoUrl={store.guestPhotoUrl} roomCode={roomCode} />
          </div>
        )}

        {/* ROW 3-4: WiFi Card */}
        {config.layout?.wifiCard?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('wifiCard', '200ms')}>
            <WifiCard ssid={store.wifiSsid} username={store.wifiUsername} password={store.wifiPassword} />
          </div>
        )}

        {/* ROW 5-7: Notification Card */}
        {config.layout?.notificationCard?.visible !== false && (
          <div className="widget-animate" style={getWidgetStyle('notificationCard', '250ms')}>
            <NotificationCard roomId={store.roomId} />
          </div>
        )}

        {/* ROW 8-10: Hotel Service */}
        {config.layout?.hotelService?.visible !== false && (
          <div className="widget-animate flex flex-col" style={getWidgetStyle('hotelService', '350ms')}>
            <HotelService onRequestService={handleServiceRequest} />
          </div>
        )}

        {/* ROW 11-12: Hotel Info */}
        {config.layout?.hotelInfo?.visible !== false && (
          <div className="widget-animate flex flex-col" style={getWidgetStyle('hotelInfo', '375ms')}>
            <HotelInfo hotelName={store.hotelName} />
          </div>
        )}


        {/* ================= SIDEBAR ================= */}
        <div className="col-start-12 col-span-1 row-start-1 row-span-12 flex flex-col items-center justify-center widget-animate" style={{ animationDelay: '600ms' }}>
          <UtilitySidebar onAction={handleAction} unreadChat={store.unreadChatCount} />
        </div>
      </div>

      {/* ===== MARQUEE BAR ===== */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.2vw] z-10 flex items-center widget-animate"
        style={{ animationDelay: '700ms', background: 'rgba(15, 23, 42, 0.75)' }}>
        <MarqueeBar />
      </div>

      {/* Modals */}
      <ChatModal isOpen={activeModal === 'chat'} onClose={() => setActiveModal(null)} />
      <AlarmModal isOpen={activeModal === 'alarm'} onClose={() => setActiveModal(null)} />
      <AppLauncher app={launchApp} isOpen={!!launchApp} onClose={() => setLaunchApp(null)} />
      <ServiceRequestModal
        isOpen={!!requestService}
        onClose={() => setRequestService(null)}
        service={requestService}
      />
      <ConnectionStatus />
    </div>
  );
}
