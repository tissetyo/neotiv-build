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

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [launchApp, setLaunchApp] = useState<AppConfig | null>(null);
  const [requestService, setRequestService] = useState<{ id: string; name: string; icon: string | null } | null>(null);

  const handleEscape = useCallback(() => {
    setActiveModal(null);
    setLaunchApp(null);
    setRequestService(null);
  }, []);

  // D-pad navigation — disabled when a modal is open
  useDpadNavigation({ enabled: mounted && !activeModal && !launchApp && !requestService, onEscape: handleEscape });

  useEffect(() => {
    // Load session from localStorage
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

  // Handle action dispatches from AppGrid utility buttons
  const handleAction = useCallback((action: string) => {
    setActiveModal(action);
  }, []);

  // Handle app launch from AppGrid
  const handleLaunchApp = useCallback((app: AppConfig) => {
    setLaunchApp(app);
  }, []);

  // Handle service request from HotelService
  const handleServiceRequest = useCallback((service: { id: string; name: string; icon: string | null }) => {
    setRequestService(service);
  }, []);

  if (!mounted) return <div className="w-[1920px] h-[1080px] bg-slate-900" />;

  const bgUrl = store.backgroundUrl || '/bg-ocean.png';

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-slate-900"
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'var(--font-body)' }}>

      {/* Main Bento Grid layout */}
      <div className="absolute inset-0 p-[2vw] grid grid-cols-12 grid-rows-12 gap-[1.5vw]" style={{ zIndex: 1, paddingBottom: '3vw' }}>
        
        {/* ROW BLOCK 1 (Top) */}
        {/* Clocks */}
        <div className="tv-widget col-span-4 row-span-2 flex items-center justify-around widget-animate tv-focusable" tabIndex={0} style={{ animationDelay: '0ms' }}>
          <AnalogClock timezone={store.clockTimezones[0]} label={store.clockLabels[0]} size={100} />
          <AnalogClock timezone={store.clockTimezones[1]} label={store.clockLabels[1]} size={120} />
          <AnalogClock timezone={store.clockTimezones[2]} label={store.clockLabels[2]} size={100} />
        </div>

        {/* Digital Clock */}
        <div className="col-span-4 row-span-3 flex items-start justify-center pt-[1vh] widget-animate tv-text-shadow" style={{ animationDelay: '100ms' }}>
          <DigitalClock timezone={store.hotelTimezone} location={store.hotelLocation} />
        </div>

        {/* Guest Info + Wifi */}
        <div className="col-span-4 row-span-4 flex flex-col gap-[1.5vw] widget-animate" style={{ animationDelay: '200ms' }}>
          <GuestCard guestName={store.guestName} guestPhotoUrl={store.guestPhotoUrl} roomCode={roomCode} />
          <WifiCard ssid={store.wifiSsid} username={store.wifiUsername} password={store.wifiPassword} />
        </div>

        {/* ROW BLOCK 2 (Middle) */}
        {/* Flight Schedule */}
        <div className="col-span-4 row-span-4 col-start-1 row-start-3 widget-animate" style={{ animationDelay: '300ms' }}>
          <FlightSchedule />
        </div>

        {/* Notifications */}
        <div className="col-span-4 row-span-2 col-start-9 row-start-5 widget-animate" style={{ animationDelay: '400ms' }}>
          <NotificationCard roomId={store.roomId} />
        </div>

        {/* ROW BLOCK 3 (Bottom) */}
        {/* Hotel Deals */}
        <div className="col-span-3 row-span-6 col-start-1 row-start-7 widget-animate" style={{ animationDelay: '500ms' }}>
          <HotelDeals />
        </div>

        {/* Service */}
        <div className="col-span-2 row-span-3 col-start-4 row-start-7 widget-animate" style={{ animationDelay: '600ms' }}>
          <HotelService onRequestService={handleServiceRequest} />
        </div>

        {/* Map */}
        <div className="col-span-2 row-span-3 col-start-4 row-start-10 widget-animate" style={{ animationDelay: '700ms' }}>
          <MapWidget location={store.hotelLocation} hotelName={store.hotelName} />
        </div>

        {/* Apps & Utilities */}
        <div className="col-span-7 row-span-6 col-start-6 row-start-7 widget-animate" style={{ animationDelay: '800ms' }}>
          <AppGrid
            onLaunchApp={handleLaunchApp}
            onAction={handleAction}
            unreadChat={store.unreadChatCount}
          />
        </div>

      </div>

      {/* Floating Marquee at absolute bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[3vw] bg-black/20 backdrop-blur-md border-t border-white/10 z-10 flex items-center widget-animate" style={{ animationDelay: '900ms' }}>
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

      {/* Connection indicator */}
      <ConnectionStatus />
    </div>
  );
}
