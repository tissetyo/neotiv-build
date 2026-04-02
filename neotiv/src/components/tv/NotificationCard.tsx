'use client';

import { useRoomStore } from '@/stores/roomStore';

export default function NotificationCard() {
  const notification = useRoomStore(s => s.latestNotification);
  const dismissNotification = useRoomStore(s => s.dismissNotification);

  if (!notification || notification.is_dismissed) {
    return (
      <div className="tv-widget-light h-full flex flex-col justify-center items-center text-slate-400">
        <span className="text-[2vw] mb-[1vh]">📭</span>
        <p className="text-[0.8vw]">No recent notifications</p>
      </div>
    );
  }

  const dateStr = new Date(notification.created_at).toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: 'numeric', month: 'short'
  });

  return (
    <div 
      className="tv-widget-light h-full flex flex-col tv-focusable relative group overflow-hidden cursor-pointer" 
      onClick={() => dismissNotification()}
      tabIndex={0}
      title="Press Enter to dismiss"
    >
      <button
        onClick={(e) => { e.stopPropagation(); dismissNotification(); }}
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
