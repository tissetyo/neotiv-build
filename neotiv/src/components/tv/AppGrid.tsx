'use client';

import type { AppConfig } from './AppLauncher';

// Extend AppConfig to include a logo URL for SimpleIcons
export interface ExtendedAppConfig extends AppConfig {
  logoColor?: string;
}

const streamingApps: ExtendedAppConfig[] = [
  { name: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/tv', embeddable: true, logoColor: 'ff0000' },
  { name: 'Disney+', icon: 'disneyplus', url: 'https://www.disneyplus.com', embeddable: false, logoColor: 'ffffff' },
  { name: 'Netflix', icon: 'netflix', url: 'https://www.netflix.com', embeddable: false, logoColor: 'e50914' },
  { name: 'YT Music', icon: 'youtubemusic', url: 'https://music.youtube.com', embeddable: true, logoColor: 'ff0000' },
  { name: 'Spotify', icon: 'spotify', url: 'https://open.spotify.com', embeddable: true, logoColor: '1db954' },
  { name: 'Prime', icon: 'primevideo', url: 'https://www.primevideo.com', embeddable: false, logoColor: '00a8e1' },
  { name: 'TV', icon: 'appletv', url: '', embeddable: false, logoColor: 'ffffff' },
  { name: 'TikTok', icon: 'tiktok', url: 'https://www.tiktok.com', embeddable: false, logoColor: 'ffffff' },
];

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
  const handleAppClick = (app: ExtendedAppConfig) => {
    if (app.name === 'TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }
    const { logoColor, ...baseApp } = app;
    onLaunchApp?.(baseApp);
  };

  return (
    <div className="h-full flex flex-col gap-[2vh]">
      {/* Streaming apps - 2 rows of 4 using CSS grid that stretches */}
      <div className="grid grid-cols-4 gap-[2vw] flex-1 h-full">
        {streamingApps.map((app, i) => (
          <button key={i} onClick={() => handleAppClick(app)}
            className="tv-widget p-0 flex flex-col items-center justify-center text-white transition-all tv-focusable relative overflow-hidden group"
            tabIndex={0}>
            {/* SVG Logo from SimpleIcons */}
            <div className="w-[4vw] h-[4vw] relative group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
              <img 
                src={`https://cdn.simpleicons.org/${app.icon}/${app.logoColor}`} 
                alt={app.name}
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </div>
            <span className="text-[1.2vw] mt-[1vh] font-medium opacity-90 tv-text-shadow tracking-wider">{app.name}</span>
            
            {/* Subtle gloss effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Utility row - 4 small glass buttons */}
      <div className="grid grid-cols-4 gap-[2vw] h-[8vh] shrink-0">
        {utilityActions.map((item) => (
          <button key={item.name} onClick={() => onAction?.(item.action)}
            className="tv-widget p-0 flex items-center justify-center gap-2 text-white transition-all hover:bg-white/10 tv-focusable relative"
            tabIndex={0}>
            <span className="text-[1.5vw] tv-text-shadow">{item.icon}</span>
            <span className="text-[1.2vw] font-medium opacity-90 tv-text-shadow tracking-wider">{item.name}</span>
            {item.action === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 shadow-md text-white text-[1vw] w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center font-bold border-2 border-white/20">
                {unreadChat}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
