'use client';

import { useState } from 'react';

interface Props {
  roomId: string | null;
}

export default function NotificationCard({ roomId }: Props) {
  const [dismissed, setDismissed] = useState(false);

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
    <div 
      className="tv-widget-light h-full flex flex-col tv-focusable relative group overflow-hidden cursor-pointer" 
      onClick={() => setDismissed(true)}
      tabIndex={0}
      title="Press Enter to dismiss"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-[0.8vw] right-[0.8vw] w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-full bg-slate-900/5 hover:bg-slate-900/15 text-slate-500 hover:text-slate-900 transition-all opacity-0 group-focus:opacity-100 group-hover:opacity-100 z-10 text-[0.7vw]"
        aria-label="Dismiss"
      >✕</button>

      <div className="flex items-center justify-between mb-[0.8vh]">
        <span className="tv-badge-red shadow-sm">Notification</span>
        <span className="text-slate-500 text-[0.65vw] mr-[2vw] font-medium">{dateStr}</span>
      </div>
      <h3 className="text-slate-900 text-[1vw] font-bold mb-[0.5vh]">{notification.title}</h3>
      <p className="text-slate-700 text-[0.75vw] leading-relaxed flex-1 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
        {notification.body}
      </p>
    </div>
  );
}
