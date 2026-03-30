'use client';

interface Props {
  hotelName: string;
}

export default function HotelInfo({ hotelName }: Props) {
  return (
    <div className="tv-widget flex-1 tv-focusable relative overflow-hidden" tabIndex={0}
      style={{ backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))' }}>
      <p className="text-white text-[16px] font-semibold">Hotel Info</p>
      <p className="text-white/70 text-[14px] mt-1">{hotelName || 'Hotel Name'}</p>
    </div>
  );
}
