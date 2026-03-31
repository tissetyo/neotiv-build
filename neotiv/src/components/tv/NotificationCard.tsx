'use client';

import { useState } from 'react';

interface Props {
  roomId: string | null;
}

export default function NotificationCard({ roomId }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // In production, this would use Supabase Realtime subscription
  const notification = {
    title: 'Title Notification',
    body: 'Lorem ipsum dolor sit amet consectetur. Scelerisque ipsum nisi elementum elementum faucibus etiam nunc turpis. Adipiscing nunc sit mattis varius tellus molestie id enim a. Amet adipiscing porttitor nunc integer auctor sed duis dolor enim. Feugiat libero sit dolor risus justo.',
    created_at: new Date().toISOString(),
  };

  if (dismissed) return null;

  const dateStr = new Date(notification.created_at).toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="tv-widget h-full flex flex-col tv-focusable relative group overflow-hidden" tabIndex={0}>
      {/* Dismiss Button - visable when focused or hovered */}
      <button 
        onClick={() => setDismissed(true)} 
        className="absolute top-[1vw] right-[1vw] w-[2vw] h-[2vw] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white/70 hover:text-white transition-all opacity-0 group-focus:opacity-100 group-hover:opacity-100 z-10"
        aria-label="Dismiss Notification"
      >
        ✕
      </button>

      <div className="flex items-center justify-between mb-[1vh]">
        <span className="tv-badge-red text-[0.8vw]">Notification</span>
        <span className="text-white/50 text-[0.8vw] mr-[3vw]">{dateStr}</span>
      </div>
      <h3 className="text-white text-[1.2vw] font-bold mb-[1vh] tv-text-shadow">{notification.title}</h3>
      <p className="text-white/70 text-[1vw] leading-relaxed flex-1 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
        {notification.body}
      </p>
    </div>
  );
}
