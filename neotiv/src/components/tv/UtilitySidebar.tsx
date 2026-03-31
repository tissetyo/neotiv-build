'use client';

interface Props {
  onAction?: (action: string) => void;
  unreadChat?: number;
}

export default function UtilitySidebar({ onAction, unreadChat = 0 }: Props) {
  const actions = [
    { name: 'Alarm', icon: '⏰', action: 'alarm' },
    { name: 'Chat', icon: '💬', action: 'chat' },
    { name: 'Notifications', icon: '🔔', action: 'notifications' },
    { name: 'Settings', icon: '⚙️', action: 'settings' },
  ];

  return (
    <div className="h-full w-[4vw] flex flex-col gap-[1vw] justify-end pb-[2vw]">
      {actions.map((item) => (
        <button
          key={item.name}
          onClick={() => onAction?.(item.action)}
          className="tv-widget w-full aspect-square rounded-[1vw] flex items-center justify-center relative transition-transform tv-focusable hover:brightness-125"
          tabIndex={0}
          title={item.name}
        >
          <span className="text-[1.8vw] drop-shadow-md">{item.icon}</span>
          {item.action === 'chat' && unreadChat > 0 && (
            <span className="absolute -top-[0.5vw] -right-[0.5vw] bg-red-500 shadow-md text-white text-[0.8vw] w-[1.5vw] h-[1.5vw] rounded-full flex items-center justify-center font-bold border-2 border-white/20 z-10">
              {unreadChat}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
