'use client';

import type { AppConfig } from './AppLauncher';

const streamingApps: AppConfig[] = [
  { name: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/tv', embeddable: true },
  { name: 'Disney+', icon: '🏰', url: 'https://www.disneyplus.com', embeddable: false },
  { name: 'Netflix', icon: '🎬', url: 'https://www.netflix.com', embeddable: false },
  { name: 'YT Music', icon: '🎵', url: 'https://music.youtube.com', embeddable: true },
  { name: 'Spotify', icon: '🎧', url: 'https://open.spotify.com', embeddable: true },
  { name: 'Prime', icon: '📦', url: 'https://www.primevideo.com', embeddable: false },
  { name: 'TV', icon: '📺', url: '', embeddable: false },
  { name: 'TikTok', icon: '🎭', url: 'https://www.tiktok.com', embeddable: false },
];

const appColors: Record<string, string> = {
  YouTube: '#FF0000',
  'Disney+': '#113CCF',
  Netflix: '#E50914',
  'YT Music': '#FF0000',
  Spotify: '#1DB954',
  Prime: '#00A8E1',
  TV: '#334155',
  TikTok: '#010101',
};

interface UtilityAction {
  name: string;
  icon: string;
  action: string; // modal key
  color: string;
}

const utilityActions: UtilityAction[] = [
  { name: 'Alarm', icon: '⏰', action: 'alarm', color: '#f59e0b' },
  { name: 'Chat', icon: '💬', action: 'chat', color: '#14b8a6' },
  { name: 'Notifications', icon: '🔔', action: 'notifications', color: '#ef4444' },
  { name: 'Settings', icon: '⚙️', action: 'settings', color: '#64748b' },
];

interface AppGridProps {
  onLaunchApp?: (app: AppConfig) => void;
  onAction?: (action: string) => void;
  unreadChat?: number;
}

export default function AppGrid({ onLaunchApp, onAction, unreadChat = 0 }: AppGridProps) {
  const handleAppClick = (app: AppConfig) => {
    if (app.name === 'TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }
    onLaunchApp?.(app);
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Streaming apps - 2 rows of 4 */}
      <div className="grid grid-cols-4 gap-2 flex-1">
        {streamingApps.map((app, i) => (
          <button key={i} onClick={() => handleAppClick(app)}
            className="rounded-xl flex flex-col items-center justify-center text-white transition-all hover:scale-105 hover:brightness-110 tv-focusable"
            tabIndex={0}
            style={{ background: appColors[app.name] || '#334155', minHeight: '60px' }}>
            <span className="text-[22px]">{app.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium opacity-90">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Utility row - 4 small icons */}
      <div className="grid grid-cols-4 gap-2" style={{ height: '50px' }}>
        {utilityActions.map((item) => (
          <button key={item.name} onClick={() => onAction?.(item.action)}
            className="rounded-xl flex items-center justify-center gap-1.5 text-white transition-all hover:scale-105 tv-focusable relative"
            tabIndex={0}
            style={{ background: item.color + '22', border: `1px solid ${item.color}44` }}>
            <span className="text-[16px]">{item.icon}</span>
            <span className="text-[10px] font-medium opacity-80">{item.name}</span>
            {item.action === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadChat}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
