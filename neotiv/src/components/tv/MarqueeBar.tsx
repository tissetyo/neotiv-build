'use client';
import { useRoomStore } from '@/stores/roomStore';

export default function MarqueeBar() {
  const config = useRoomStore(s => s.tvLayoutConfig);
  
  const customText = config?.theme?.marqueeText;
  const customSpeed = config?.theme?.marqueeSpeed;

  const fallbackText = [
    'Welcome to our hotel. Enjoy your stay!',
    'Breakfast is served from 06:00 to 10:00.',
    'For any assistance, please use the Chat button.'
  ].join('  •  ');

  const text = customText?.trim() || fallbackText;
  const duration = typeof customSpeed === 'number' && customSpeed > 0 ? customSpeed : Math.max(text.length / 8, 20);

  return (
    <div className="w-full h-full overflow-hidden flex items-center"
      style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="whitespace-nowrap animate-marquee text-white/80 text-[15px]"
        style={{ animationDuration: `${duration}s` }}>
        {text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{text}
      </div>
    </div>
  );
}
