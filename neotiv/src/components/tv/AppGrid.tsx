'use client';

import type { AppConfig } from './AppLauncher';

// Explicitly defining exact brand colors for the card glows
export interface BrandAppConfig extends AppConfig {
  logoId: string;
  brandColor: string;
}

const streamingApps: BrandAppConfig[] = [
  { name: 'YouTube', logoId: 'youtube', brandColor: '#FF0000', url: 'https://www.youtube.com/tv', embeddable: true, icon: '' },
  { name: 'Disney+', logoId: 'disneyplus', brandColor: '#113CCF', url: 'https://www.disneyplus.com', embeddable: false, icon: '' },
  { name: 'Netflix', logoId: 'netflix', brandColor: '#E50914', url: 'https://www.netflix.com', embeddable: false, icon: '' },
  { name: 'YT Music', logoId: 'youtubemusic', brandColor: '#FF0000', url: 'https://music.youtube.com', embeddable: true, icon: '' },
  { name: 'Spotify', logoId: 'spotify', brandColor: '#1DB954', url: 'https://open.spotify.com', embeddable: true, icon: '' },
  { name: 'Prime', logoId: 'primevideo', brandColor: '#00A8E1', url: 'https://www.primevideo.com', embeddable: false, icon: '' },
  { name: 'Apple TV', logoId: 'appletv', brandColor: '#FFFFFF', url: '', embeddable: false, icon: '' },
  { name: 'TikTok', logoId: 'tiktok', brandColor: '#EE1D52', url: 'https://www.tiktok.com', embeddable: false, icon: '' },
];

interface AppGridProps {
  onLaunchApp?: (app: AppConfig) => void;
}

export default function AppGrid({ onLaunchApp }: AppGridProps) {
  const handleAppClick = (app: BrandAppConfig) => {
    if (app.name === 'Apple TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }
    const { logoId, brandColor, ...baseApp } = app;
    onLaunchApp?.(baseApp);
  };

  return (
    <div className="h-full grid grid-cols-4 gap-[1.2vw]">
      {streamingApps.map((app, i) => (
        <button key={i} onClick={() => handleAppClick(app)}
          className="tv-widget tv-app-card flex flex-col items-center justify-center text-white tv-focusable overflow-hidden group border-0 p-0"
          style={{ '--app-color': app.brandColor } as React.CSSProperties}
          tabIndex={0}>
          
          {/* Logo container safely sizing the precise SVG */}
          <div className="w-[4.5vw] h-[4.5vw] relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
            <img 
              src={`https://cdn.simpleicons.org/${app.logoId}/ffffff`}
              alt={app.name}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              aria-hidden="true"
            />
          </div>
          <span className="text-[1vw] mt-[1vh] font-medium opacity-90 tv-text-shadow tracking-wider z-10">{app.name}</span>
        </button>
      ))}
    </div>
  );
}
