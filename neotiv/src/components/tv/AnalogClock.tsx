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
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const outer = r - 2;
          const inner = i % 3 === 0 ? r - 12 : r - 8;
          return (
            <line key={i}
              x1={cx + Math.cos(angle) * inner} y1={cy + Math.sin(angle) * inner}
              x2={cx + Math.cos(angle) * outer} y2={cy + Math.sin(angle) * outer}
              stroke={i % 3 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"} 
              strokeWidth={i % 3 === 0 ? 2 : 1} />
          );
        })}
        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((hourAngle - 90) * Math.PI / 180) * (r * 0.45)}
          y2={cy + Math.sin((hourAngle - 90) * Math.PI / 180) * (r * 0.45)}
          stroke="white" strokeWidth="3" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((minuteAngle - 90) * Math.PI / 180) * (r * 0.65)}
          y2={cy + Math.sin((minuteAngle - 90) * Math.PI / 180) * (r * 0.65)}
          stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((secondAngle - 90) * Math.PI / 180) * (r * 0.75)}
          y2={cy + Math.sin((secondAngle - 90) * Math.PI / 180) * (r * 0.75)}
          stroke="#5eead4" strokeWidth="1" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="white" />
      </svg>
      <span className="text-white/80 text-[13px] font-medium tracking-wide mt-2">{label}</span>
    </div>
  );
}
