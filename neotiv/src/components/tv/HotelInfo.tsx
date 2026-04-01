'use client';

interface Props {
  hotelName: string;
}

export default function HotelInfo({ hotelName }: Props) {
  return (
    <div className="tv-widget flex-1 tv-focusable flex flex-col justify-center" tabIndex={0}>
      <p className="text-white/60 text-[0.7vw] font-semibold mb-[0.3vh]">Hotel Info</p>
      <p className="text-white text-[0.9vw] font-bold tv-text-shadow">{hotelName || 'Hotel Name'}</p>
    </div>
  );
}
