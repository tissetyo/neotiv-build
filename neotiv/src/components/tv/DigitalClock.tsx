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

  const dateStr = tzTime.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone,
  });

  return (
    <div className="text-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[18px]">☁️</span>
        <span className="text-[18px] text-white/80">{weather.temp}°C • {location || 'Kuta, Bali'}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-[96px] font-bold leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{timeStr}</span>
        <span className="text-[36px] font-semibold text-white/80">{ampm}</span>
      </div>
      <p className="text-[20px] text-white/70 mt-1">{dateStr}</p>
    </div>
  );
}
