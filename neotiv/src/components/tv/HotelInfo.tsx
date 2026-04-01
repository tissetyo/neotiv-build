'use client';

interface Props {
  hotelName: string;
}

export default function HotelInfo({ hotelName }: Props) {
  return (
    <div className="tv-widget-light flex-1 tv-focusable flex flex-col justify-center" tabIndex={0}>
      <p className="text-slate-500 text-[0.65vw] font-bold mb-[0.2vh] uppercase tracking-wide">Hotel Info</p>
      <p className="text-slate-900 text-[0.85vw] font-bold">{hotelName || 'Hotel Name'}</p>
    </div>
  );
}
