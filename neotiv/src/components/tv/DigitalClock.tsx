'use client';

import { useEffect, useState } from 'react';

interface Props {
  timezone: string;
  location: string;
}

export default function DigitalClock({ timezone, location }: Props) {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 24, description: 'Partly cloudy' });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const city = location?.split(',')[0]?.trim() || 'Bali';
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => setWeather({ temp: d.temp || 24, description: d.description || 'Clear' }))
      .catch(() => {});
  }, [location]);

  const tzTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
  const hours = tzTime.getHours();
  const minutes = tzTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const timeStr = `${String(h12).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
  return (
    <div className="flex flex-col text-white">
      <div className="flex items-center gap-2 mb-1 text-white/80 font-medium">
        <span className="text-[15px]">☁️</span>
        <span className="text-[14px] tracking-wide">24°C • {location || 'Hotel'}</span>
      </div>
      <div className="flex items-baseline gap-4 -ml-1">
        <span className="text-[100px] font-bold leading-none font-serif tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }).replace(':', '.')}
        </span>
        <span className="text-2xl font-medium text-white/80 tracking-widest uppercase">
          {time.toLocaleTimeString('en-US', { hour12: true, timeZone: timezone }).split(' ')[1]}
        </span>
      </div>
      <div className="text-[18px] text-white/90 font-medium tracking-wide mt-2">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })}
      </div>
    </div>
  );
}
