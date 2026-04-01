'use client';

import type { AppConfig } from './AppLauncher';
import { SiYoutube, SiNetflix, SiYoutubemusic, SiSpotify, SiAppletv, SiTiktok } from 'react-icons/si';
import type { IconType } from 'react-icons';

// Explicitly defining exact brand colors for the card glows
export interface BrandAppConfig extends AppConfig {
  logoId: string;
  brandColor: string;
  Icon: IconType;
}

const streamingApps: BrandAppConfig[] = [
  { name: 'YouTube', logoId: 'youtube', brandColor: '#FF0000', url: 'https://www.youtube.com/tv', embeddable: true, icon: '', Icon: SiYoutube },
  { name: 'Disney+', logoId: 'disneyplus', brandColor: '#113CCF', url: 'https://www.disneyplus.com', embeddable: false, icon: '', Icon: SiYoutube }, // Replace with exact 'si' import when ready
  { name: 'Netflix', logoId: 'netflix', brandColor: '#E50914', url: 'https://www.netflix.com', embeddable: false, icon: '', Icon: SiNetflix },
  { name: 'YT Music', logoId: 'youtubemusic', brandColor: '#FF0000', url: 'https://music.youtube.com', embeddable: true, icon: '', Icon: SiYoutubemusic },
  { name: 'Spotify', logoId: 'spotify', brandColor: '#1DB954', url: 'https://open.spotify.com', embeddable: true, icon: '', Icon: SiSpotify },
  { name: 'Prime', logoId: 'primevideo', brandColor: '#00A8E1', url: 'https://www.primevideo.com', embeddable: false, icon: '', Icon: SiYoutube }, // Replace with exact 'si' import when ready
  { name: 'Apple TV', logoId: 'appletv', brandColor: '#FFFFFF', url: '', embeddable: false, icon: '', Icon: SiAppletv },
  { name: 'TikTok', logoId: 'tiktok', brandColor: '#EE1D52', url: 'https://www.tiktok.com', embeddable: false, icon: '', Icon: SiTiktok },
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
    const { logoId, brandColor, Icon, ...baseApp } = app;
    onLaunchApp?.(baseApp);
  };

  return (
    <div className="h-full grid grid-cols-4 gap-[0.6vw]">
      {streamingApps.map((app, i) => (
        <button key={i} onClick={() => handleAppClick(app)}
          className="tv-widget tv-app-card flex flex-col items-center justify-center text-white tv-focusable overflow-hidden group border-0 p-0"
          style={{ '--app-color': app.brandColor } as React.CSSProperties}
          tabIndex={0}>
          
          <div className="text-[2.5vw] relative z-10 transition-transform duration-300 group-hover:scale-110 mb-[0.5vh]">
             <app.Icon />
          </div>
          <span className="text-[0.9vw] font-medium opacity-90 tv-text-shadow tracking-wider z-10 mt-[0.2vh]">{app.name}</span>
        </button>
      ))}
    </div>
  );
}
