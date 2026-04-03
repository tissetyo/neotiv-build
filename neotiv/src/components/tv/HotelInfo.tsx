'use client';

import { Building2 } from 'lucide-react';

interface Props {
  hotelName: string;
  featuredImageUrl?: string | null;
}

export default function HotelInfo({ hotelName, featuredImageUrl }: Props) {
  return (
    <div className="tv-widget-light flex-1 tv-focusable flex flex-row items-center gap-[0.6vw] overflow-hidden" tabIndex={0}>
      {featuredImageUrl ? (
        <div className="w-[3.5vw] h-[3.5vw] rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={featuredImageUrl}
            alt={hotelName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-[3.5vw] h-[3.5vw] rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(148, 163, 184, 0.15)' }}>
          <Building2 className="w-[1.5vw] h-[1.5vw] text-slate-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-slate-500 text-[0.55vw] font-bold mb-[0.1vh] uppercase tracking-wide">Hotel Info</p>
        <p className="text-slate-900 text-[0.8vw] font-bold truncate">{hotelName || 'Hotel Name'}</p>
      </div>
    </div>
  );
}
