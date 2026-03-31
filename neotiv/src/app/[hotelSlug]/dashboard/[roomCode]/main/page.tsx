'use client';

import { useEffect, useState, useCallback, use } from 'react';
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
import MapWidget from '@/components/tv/MapWidget';
import AppGrid from '@/components/tv/AppGrid';
import MarqueeBar from '@/components/tv/MarqueeBar';
import ChatModal from '@/components/tv/ChatModal';
import AlarmModal from '@/components/tv/AlarmModal';
import AppLauncher from '@/components/tv/AppLauncher';
import ServiceRequestModal from '@/components/tv/ServiceRequestModal';
import ConnectionStatus from '@/components/tv/ConnectionStatus';
import type { AppConfig } from '@/components/tv/AppLauncher';

export default function MainDashboardPage({ params }: { params: Promise<{ hotelSlug: string; roomCode: string }> }) {
  const { hotelSlug, roomCode } = use(params);
  const store = useRoomStore();
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
  }, [hotelSlug, roomCode, store]);

  const handleAction = useCallback((action: string) => { setActiveModal(action); }, []);
  const handleLaunchApp = useCallback((app: AppConfig) => { setLaunchApp(app); }, []);
  const handleServiceRequest = useCallback((service: { id: string; name: string; icon: string | null }) => { setRequestService(service); }, []);

  if (!mounted) return <div className="w-screen h-screen bg-slate-900" />;

  const bgUrl = store.backgroundUrl || '/bg-ocean.png';

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-slate-900"
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'var(--font-body)' }}>

      {/* ===== BENTO GRID ===== */}
      <div className="absolute inset-0 grid gap-[0.8vw]" style={{
        zIndex: 1,
        padding: '1.5vw 1.5vw 3.5vw 1.5vw',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(10, 1fr)',
      }}>

        {/* ── Row 1-2: Clocks | Digital Clock | Guest + Wifi ── */}
        <div className="col-span-4 row-span-2 tv-widget flex items-center justify-around widget-animate tv-focusable" tabIndex={0} style={{ animationDelay: '0ms' }}>
          <AnalogClock timezone={store.clockTimezones[0]} label={store.clockLabels[0]} size={90} />
          <AnalogClock timezone={store.clockTimezones[1]} label={store.clockLabels[1]} size={110} />
          <AnalogClock timezone={store.clockTimezones[2]} label={store.clockLabels[2]} size={90} />
        </div>

        <div className="col-span-4 row-span-2 flex items-center justify-center widget-animate tv-text-shadow" style={{ animationDelay: '100ms' }}>
          <DigitalClock timezone={store.hotelTimezone} location={store.hotelLocation} />
        </div>

        <div className="col-span-4 row-span-2 flex flex-col gap-[0.8vw] widget-animate" style={{ animationDelay: '200ms' }}>
          <GuestCard guestName={store.guestName} guestPhotoUrl={store.guestPhotoUrl} roomCode={roomCode} />
          <WifiCard ssid={store.wifiSsid} username={store.wifiUsername} password={store.wifiPassword} />
        </div>

        {/* ── Row 3-5: Flight Schedule | (open bg) | Notification ── */}
        <div className="col-span-4 row-span-3 widget-animate" style={{ animationDelay: '300ms' }}>
          <FlightSchedule />
        </div>

        {/* Open background space in center - no widget here */}
        <div className="col-span-4 row-span-3" />

        <div className="col-span-4 row-span-3 widget-animate" style={{ animationDelay: '400ms' }}>
          <NotificationCard roomId={store.roomId} />
        </div>

        {/* ── Row 6-10: Deals | Service | Map | Apps ── */}
        <div className="col-span-2 row-span-5 widget-animate" style={{ animationDelay: '500ms' }}>
          <HotelDeals />
        </div>

        <div className="col-span-2 row-span-5 flex flex-col gap-[0.8vw] widget-animate" style={{ animationDelay: '600ms' }}>
          <HotelService onRequestService={handleServiceRequest} />
          <MapWidget location={store.hotelLocation} hotelName={store.hotelName} />
        </div>

        <div className="col-span-8 row-span-5 widget-animate" style={{ animationDelay: '700ms' }}>
          <AppGrid
            onLaunchApp={handleLaunchApp}
            onAction={handleAction}
            unreadChat={store.unreadChatCount}
          />
        </div>
      </div>

      {/* ===== MARQUEE BAR (pinned to bottom) ===== */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5vw] z-10 flex items-center widget-animate" style={{ animationDelay: '800ms', background: 'rgba(15, 23, 42, 0.7)' }}>
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
