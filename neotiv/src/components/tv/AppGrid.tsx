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
    <div className="h-full flex flex-col gap-4">
      {/* Streaming apps - 2 rows of 4 using CSS grid that stretches */}
      <div className="grid grid-cols-4 gap-4 flex-1 h-full">
        {streamingApps.map((app, i) => (
          <button key={i} onClick={() => handleAppClick(app)}
            className="rounded-2xl flex flex-col items-center justify-center text-white transition-all tv-focusable shadow-lg relative overflow-hidden group"
            tabIndex={0}
            style={{ background: appColors[app.name] || '#334155' }}>
            <span className="text-[48px] drop-shadow-md group-hover:scale-110 transition-transform duration-300">{app.icon}</span>
            <span className="text-[12px] mt-2 font-medium opacity-90">{app.name}</span>
            
            {/* Subtle gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Utility row - 4 small glass buttons */}
      <div className="grid grid-cols-4 gap-4 h-[60px]">
        {utilityActions.map((item) => (
          <button key={item.name} onClick={() => onAction?.(item.action)}
            className="rounded-xl flex items-center justify-center gap-2 text-white transition-all hover:bg-white/10 tv-focusable relative bg-white/5 border border-white/10 backdrop-blur-md"
            tabIndex={0}>
            <span className="text-[18px]">{item.icon}</span>
            <span className="text-[12px] font-medium opacity-90">{item.name}</span>
            {item.action === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 shadow-md text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadChat}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
