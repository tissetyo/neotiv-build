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
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

      {/* ===== BENTO GRID — matches reference layout ===== */}
      <div className="absolute inset-0 grid gap-[0.6vw]" style={{
        zIndex: 1,
        padding: '1.2vw 1.2vw 3vw 1.2vw',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(12, 1fr)',
      }}>

        {/* ── ROW 1-2: Analog Clocks | Digital Clock (no card) | Guest + Room ── */}
        <div className="col-span-3 row-span-2 tv-widget flex items-center justify-around widget-animate tv-focusable" tabIndex={0}>
          <AnalogClock timezone={store.clockTimezones[0]} label={store.clockLabels[0]} size={80} />
          <AnalogClock timezone={store.clockTimezones[1]} label={store.clockLabels[1]} size={100} />
          <AnalogClock timezone={store.clockTimezones[2]} label={store.clockLabels[2]} size={80} />
        </div>

        <div className="col-span-5 row-span-2 flex items-center justify-center tv-text-shadow widget-animate" style={{ animationDelay: '50ms' }}>
          <DigitalClock timezone={store.hotelTimezone} location={store.hotelLocation} />
        </div>

        <div className="col-span-3 row-span-2 widget-animate" style={{ animationDelay: '100ms' }}>
          <GuestCard guestName={store.guestName} guestPhotoUrl={store.guestPhotoUrl} roomCode={roomCode} />
        </div>

        {/* Utility sidebar - far right column, spans full height */}
        <div className="col-span-1 row-span-12 col-start-12 row-start-1 flex flex-col items-center justify-center widget-animate" style={{ animationDelay: '600ms' }}>
          <UtilitySidebar onAction={handleAction} unreadChat={store.unreadChatCount} />
        </div>

        {/* ── ROW 3-6: Flight Schedule | Open BG | WiFi + Notification ── */}
        <div className="col-span-4 row-span-5 widget-animate" style={{ animationDelay: '150ms' }}>
          <FlightSchedule />
        </div>

        {/* Open background in center */}
        <div className="col-span-4 row-span-5" />

        <div className="col-span-3 row-span-2 widget-animate" style={{ animationDelay: '200ms' }}>
          <WifiCard ssid={store.wifiSsid} username={store.wifiUsername} password={store.wifiPassword} />
        </div>

        <div className="col-span-3 row-span-3 widget-animate" style={{ animationDelay: '250ms' }}>
          <NotificationCard roomId={store.roomId} />
        </div>

        {/* ── ROW 8-12: Hotel Deals | Service+Info | Map | App Grid ── */}
        <div className="col-span-2 row-span-5 widget-animate overflow-hidden" style={{ animationDelay: '300ms' }}>
          <HotelDeals />
        </div>

        <div className="col-span-2 row-span-5 flex flex-col gap-[0.6vw] widget-animate" style={{ animationDelay: '350ms' }}>
          <HotelService onRequestService={handleServiceRequest} />
          <HotelInfo hotelName={store.hotelName} />
        </div>

        <div className="col-span-2 row-span-5 widget-animate" style={{ animationDelay: '400ms' }}>
          <MapWidget location={store.hotelLocation} hotelName={store.hotelName} />
        </div>

        <div className="col-span-5 row-span-5 widget-animate" style={{ animationDelay: '450ms' }}>
          <AppGrid onLaunchApp={handleLaunchApp} />
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
