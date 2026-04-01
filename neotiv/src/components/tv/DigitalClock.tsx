'use client';

import { useEffect, useState } from 'react';

interface Props {
  timezone: string;
  location: string;
}

export default function DigitalClock({ timezone, location }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    try {
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }).replace(':', '.');
    } catch {
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
    }
  };

  const formatAmPm = () => {
    try {
      return time.toLocaleTimeString('en-US', { hour12: true, timeZone: timezone }).split(' ')[1];
    } catch {
      return time.toLocaleTimeString('en-US', { hour12: true }).split(' ')[1];
    }
  };

  const formatDate = () => {
    try {
      return time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone });
    } catch {
      return time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col text-white tv-text-shadow">
      <div className="flex items-center gap-[0.5vw] mb-[0.3vh]">
        <span className="text-[1vw]">☁️</span>
        <span className="text-[0.9vw] text-white/80 font-medium">24°C • {location || 'Hotel'}</span>
      </div>
      <div className="flex items-baseline gap-[0.8vw]">
        <span className="text-[6vw] font-bold leading-none tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          {formatTime()}
        </span>
        <span className="text-[1.5vw] font-medium text-white/80 tracking-widest uppercase">
          {formatAmPm()}
        </span>
      </div>
      <div className="text-[1.1vw] text-white/90 font-medium tracking-wide mt-[0.3vh]">
        {formatDate()}
      </div>
    </div>
  );
}
