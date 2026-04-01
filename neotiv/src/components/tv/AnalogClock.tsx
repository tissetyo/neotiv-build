'use client';

import { useEffect, useState } from 'react';

interface Props {
  timezone: string;
  label: string;
  size?: number;
}

export default function AnalogClock({ timezone, label, size = 120 }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const tzTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
  const hours = tzTime.getHours() % 12;
  const minutes = tzTime.getMinutes();
  const seconds = tzTime.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const r = size / 2;
  const cx = r;
  const cy = r;

  return (
    <div className="flex flex-col items-center gap-[0.8vh]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const isMain = i % 3 === 0;
          const outer = r - 4;
          const inner = isMain ? r - 14 : r - 8;
          return (
            <line key={i}
              x1={cx + Math.cos(angle) * inner} y1={cy + Math.sin(angle) * inner}
              x2={cx + Math.cos(angle) * outer} y2={cy + Math.sin(angle) * outer}
              stroke={isMain ? "#ffffff" : "rgba(255,255,255,0.4)"} 
              strokeWidth={isMain ? 2.5 : 1.5}
              strokeLinecap="round" />
          );
        })}
        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((hourAngle - 90) * Math.PI / 180) * (r * 0.45)}
          y2={cy + Math.sin((hourAngle - 90) * Math.PI / 180) * (r * 0.45)}
          stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((minuteAngle - 90) * Math.PI / 180) * (r * 0.65)}
          y2={cy + Math.sin((minuteAngle - 90) * Math.PI / 180) * (r * 0.65)}
          stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((secondAngle - 90) * Math.PI / 180) * (r * 0.75)}
          y2={cy + Math.sin((secondAngle - 90) * Math.PI / 180) * (r * 0.75)}
          stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" />
      </svg>
      <span className="text-white/80 text-[0.8vw] font-medium tracking-wide">{label}</span>
    </div>
  );
}
