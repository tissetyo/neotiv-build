'use client';

import { useRoomStore } from '@/stores/roomStore';

interface Props {
  onRequestService?: (service: { id: string; name: string; icon: string | null }) => void;
}

const defaultServices = [
  { id: 'default-1', name: 'Room Service', icon: '🍽️', sort_order: 0 },
  { id: 'default-2', name: 'Restaurant', icon: '🍴', sort_order: 1 },
  { id: 'default-3', name: 'Car Rental', icon: '🚗', sort_order: 2 },
  { id: 'default-4', name: 'Scooter', icon: '🛵', sort_order: 3 },
  { id: 'default-6', name: 'Laundry', icon: '👕', sort_order: 5 },
];

export default function HotelService({ onRequestService }: Props) {
  const services = useRoomStore((s) => s.services);
  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <button
      className="tv-widget-light flex-1 flex flex-col w-full text-left tv-focusable"
      tabIndex={0}
      onClick={() => onRequestService?.({ id: 'menu', name: 'Hotel Services', icon: '🛎' })}
    >
      <div className="flex items-center gap-[0.4vw] mb-[0.5vh]">
        <span className="text-[0.9vw] drop-shadow-sm">🛎</span>
        <span className="text-slate-900 text-[0.75vw] font-bold tracking-wide">Hotel Service</span>
      </div>
      <div className="grid grid-cols-3 gap-[0.4vw] flex-1 content-start w-full cursor-pointer">
        {displayServices.slice(0, 6).map((service) => (
          <div
            key={service.id}
            className="flex flex-col items-center justify-center rounded-lg p-[0.3vw]"
            style={{ background: 'rgba(0,0,0,0.03)' }}
            title={service.name}
          >
            <span className="text-[1.2vw] drop-shadow-sm">{service.icon || '🛎'}</span>
            <span className="text-slate-700 text-[0.55vw] mt-[0.2vh] leading-tight text-center truncate w-full font-bold">
              {service.name}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
