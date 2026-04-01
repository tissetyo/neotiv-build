'use client';

import type { AppConfig } from './AppLauncher';
import { SiYoutube, SiNetflix, SiYoutubemusic, SiSpotify, SiAppletv, SiTiktok } from 'react-icons/si';
import type { IconType } from 'react-icons';

export interface BrandAppConfig extends AppConfig {
  brandColor: string;
  Icon: IconType;
  subtitle?: string;
}

const streamingApps: BrandAppConfig[] = [
  { name: 'YouTube', brandColor: '#FF0000', url: 'https://www.youtube.com/tv', embeddable: true, icon: '', Icon: SiYoutube },
  { name: 'Disney+', brandColor: '#0057FF', url: 'https://www.disneyplus.com', embeddable: false, icon: '', Icon: SiYoutube },
  { name: 'Netflix', brandColor: '#E50914', url: 'https://www.netflix.com', embeddable: false, icon: '', Icon: SiNetflix, subtitle: 'Watch Now' },
  { name: 'YT Music', brandColor: '#FF0000', url: 'https://music.youtube.com', embeddable: true, icon: '', Icon: SiYoutubemusic },
  { name: 'Spotify', brandColor: '#1DB954', url: 'https://open.spotify.com', embeddable: true, icon: '', Icon: SiSpotify },
  { name: 'Prime', brandColor: '#00A8E1', url: 'https://www.primevideo.com', embeddable: false, icon: '', Icon: SiYoutube },
  { name: 'TV', brandColor: '#A3A3A3', url: '', embeddable: false, icon: '', Icon: SiAppletv, subtitle: 'Explore Channel' },
  { name: 'TikTok', brandColor: '#EE1D52', url: 'https://www.tiktok.com', embeddable: false, icon: '', Icon: SiTiktok },
];

interface AppGridProps {
  onLaunchApp?: (app: AppConfig) => void;
}

export default function AppGrid({ onLaunchApp }: AppGridProps) {
  const handleAppClick = (app: BrandAppConfig) => {
    if (app.name === 'TV') {
      window.dispatchEvent(new CustomEvent('neotiv:switch-to-tv', { bubbles: true }));
      return;
    }
    const { brandColor, Icon, subtitle, ...baseApp } = app;
    onLaunchApp?.(baseApp);
  };

  return (
    <div className="h-full grid grid-cols-4 grid-rows-2 gap-[0.5vw]">
      {streamingApps.map((app, i) => (
        <button key={i} onClick={() => handleAppClick(app)}
          className="tv-app-card tv-focusable rounded-[var(--widget-radius)] flex flex-col items-center justify-center text-white group"
          style={{ '--app-color': app.brandColor } as React.CSSProperties}
          tabIndex={0}>

          <div className="text-[1.8vw] group-hover:scale-110 transition-transform duration-300 relative z-10"
            style={{ color: app.brandColor }}>
            <app.Icon />
          </div>
          <span className="text-[0.7vw] font-semibold mt-[0.4vh] tracking-wide relative z-10">{app.name}</span>
          {app.subtitle && (
            <span className="text-[0.5vw] text-white/40 mt-[0.1vh] relative z-10">{app.subtitle}</span>
          )}
        </button>
      ))}
    </div>
  );
}
