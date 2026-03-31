'use client';

import type { AppConfig } from './AppLauncher';

const streamingApps: (AppConfig & { emoji: string })[] = [
  { name: 'YouTube', icon: 'youtube', emoji: '▶️', url: 'https://www.youtube.com/tv', embeddable: true },
  { name: 'Disney+', icon: 'disney', emoji: '🏰', url: 'https://www.disneyplus.com', embeddable: false },
  { name: 'Netflix', icon: 'netflix', emoji: '🎬', url: 'https://www.netflix.com', embeddable: false },
  { name: 'YT Music', icon: 'ytmusic', emoji: '🎵', url: 'https://music.youtube.com', embeddable: true },
  { name: 'Spotify', icon: 'spotify', emoji: '🎧', url: 'https://open.spotify.com', embeddable: true },
  { name: 'Prime', icon: 'prime', emoji: '📦', url: 'https://www.primevideo.com', embeddable: false },
  { name: 'TV', icon: 'tv', emoji: '📺', url: '', embeddable: false },
  { name: 'TikTok', icon: 'tiktok', emoji: '🎭', url: 'https://www.tiktok.com', embeddable: false },
];

const utilityActions = [
  { name: 'Alarm', emoji: '⏰', action: 'alarm' },
  { name: 'Chat', emoji: '💬', action: 'chat' },
  { name: 'Notifications', emoji: '🔔', action: 'notifications' },
  { name: 'Settings', emoji: '⚙️', action: 'settings' },
];

interface AppGridProps {
  onLaunchApp?: (app: AppConfig) => void;
  onAction?: (action: string) => void;
  unreadChat?: number;
}

export default function AppGrid({ onLaunchApp, onAction, unreadChat = 0 }: AppGridProps) {
  const handleAppClick = (app: AppConfig & { emoji: string }) => {
    if (app.name === 'TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }
    const { emoji, ...baseApp } = app;
    onLaunchApp?.(baseApp);
  };

  return (
    <div className="h-full flex flex-col gap-[1vw]">
      {/* Streaming apps - 2 rows of 4 */}
      <div className="grid grid-cols-4 gap-[1vw] flex-1">
        {streamingApps.map((app, i) => (
          <button key={i} onClick={() => handleAppClick(app)}
            className="tv-widget flex flex-col items-center justify-center text-white transition-all tv-focusable relative overflow-hidden group"
            tabIndex={0}>
            <span className="text-[3vw] group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{app.emoji}</span>
            <span className="text-[0.9vw] mt-[0.5vh] font-semibold tv-text-shadow tracking-wide">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Utility row */}
      <div className="grid grid-cols-4 gap-[1vw] h-[5vh] shrink-0">
        {utilityActions.map((item) => (
          <button key={item.name} onClick={() => onAction?.(item.action)}
            className="tv-widget flex items-center justify-center gap-[0.5vw] text-white transition-all hover:brightness-110 tv-focusable relative"
            tabIndex={0}>
            <span className="text-[1.2vw]">{item.emoji}</span>
            <span className="text-[0.9vw] font-semibold tv-text-shadow">{item.name}</span>
            {item.action === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.7vw] w-[1.5vw] h-[1.5vw] rounded-full flex items-center justify-center font-bold">
                {unreadChat}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
