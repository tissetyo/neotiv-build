'use client';

import { ConciergeBell } from 'lucide-react';

interface Props {
  onRequestService?: (service: { id: string; name: string; icon: string | null }) => void;
}

export default function HotelService({ onRequestService }: Props) {
  return (
    <button
      className="tv-widget-light flex-1 flex flex-col items-center justify-center w-full text-center tv-focusable group"
      tabIndex={0}
      onClick={() => onRequestService?.({ id: 'menu', name: 'Hotel Services', icon: '🛎' })}
    >
      <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-slate-900/5 group-hover:bg-teal-500/10 flex items-center justify-center transition-colors mb-2">
        <ConciergeBell className="w-[1.8vw] h-[1.8vw] text-slate-800" strokeWidth={2} />
      </div>
      <span className="text-slate-900 text-[0.8vw] font-bold tracking-wide">Hotel Services</span>
      <span className="text-slate-500 text-[0.6vw] mt-1">Order on mobile</span>
    </button>
  );
}
