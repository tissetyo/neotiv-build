'use client';

import { AlarmClock, MessageCircle, Bell, Settings, LayoutGrid, Grid3x3 } from 'lucide-react';

interface Props {
  onAction?: (action: string) => void;
  unreadChat?: number;
}

export default function UtilitySidebar({ onAction, unreadChat = 0 }: Props) {
  const actions = [
    { name: 'Alarm', icon: AlarmClock, action: 'alarm', color: '#f59e0b' },
    { name: 'Chat', icon: MessageCircle, action: 'chat', color: '#14b8a6' },
    { name: 'Notifications', icon: Bell, action: 'notifications', color: '#ef4444' },
    { name: 'Settings', icon: Settings, action: 'settings', color: '#94a3b8' },
    { name: 'Grid View', icon: LayoutGrid, action: 'grid', color: '#64748b' },
    { name: 'Apps', icon: Grid3x3, action: 'apps', color: '#64748b' },
  ];

  return (
    <div className="flex flex-col gap-[0.4vw]">
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.name}
            onClick={() => onAction?.(item.action)}
            className="w-[2.2vw] h-[2.2vw] rounded-[8px] flex items-center justify-center relative transition-all tv-focusable hover:brightness-125"
            style={{
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
            tabIndex={0}
            title={item.name}
          >
            <Icon size={14} color={item.color} strokeWidth={2} />
            {item.action === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-[0.2vw] -right-[0.2vw] bg-red-500 text-white text-[0.5vw] w-[1vw] h-[1vw] rounded-full flex items-center justify-center font-bold">
                {unreadChat}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
