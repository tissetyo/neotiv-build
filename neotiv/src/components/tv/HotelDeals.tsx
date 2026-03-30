'use client';

export default function HotelDeals() {
  return (
    <div className="tv-widget h-full flex flex-col tv-focusable" tabIndex={0}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">✨</span>
          <span className="text-white text-[16px] font-semibold">Hotel Deals</span>
        </div>
        <span className="text-white/40 text-[18px]">→</span>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl">
        <img src="/promo.png" alt="Hotel Deal" className="w-full h-full object-cover rounded-xl" />
      </div>
    </div>
  );
}
