'use client';

import QRCode from 'react-qr-code';
import { Wifi } from 'lucide-react';

interface Props {
  ssid: string;
  username?: string;
  password?: string;
}

export default function WifiCard({ ssid, username, password }: Props) {
  if (!ssid) {
    return (
      <div className="tv-widget-light h-full flex flex-col items-center justify-center opacity-70 tv-focusable" tabIndex={0}>
         <Wifi className="w-[2vw] h-[2vw] text-slate-400 mb-2" />
         <span className="text-slate-500 text-[0.8vw] font-medium">WiFi Unconfigured</span>
      </div>
    );
  }

  const wifiString = `WIFI:S:${ssid};T:WPA;P:${password || ''};;`;

  return (
    <div className="h-full flex flex-col rounded-[var(--widget-radius)] overflow-hidden shadow-xl tv-focusable transition-transform hover:scale-[1.02]" tabIndex={0}>
      {/* Dark Header */}
      <div className="bg-teal-900/90 backdrop-blur-md px-[1.5vw] py-[0.8vw] flex items-center gap-[0.5vw]">
         <Wifi className="w-[1.2vw] h-[1.2vw] text-white" strokeWidth={2.5} />
         <span className="text-white font-semibold tracking-wide text-[1vw]">Wifi Access</span>
      </div>
      
      {/* Light Body */}
      <div className="bg-white/95 backdrop-blur-xl flex-1 flex items-center p-[1vw] gap-[1.5vw]">
        <div className="rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-white">
          <QRCode value={wifiString} size={110} level="M" />
        </div>
        
        <div className="flex flex-col gap-[0.8vw] min-w-0 flex-1">
          <div>
            <p className="text-slate-500 text-[0.6vw] font-medium tracking-wide">SSID</p>
            <p className="text-slate-900 text-[1.1vw] font-bold leading-tight truncate">{ssid}</p>
          </div>
          {username && (
            <div>
              <p className="text-slate-500 text-[0.6vw] font-medium tracking-wide">Username</p>
              <p className="text-slate-900 text-[0.9vw] font-semibold leading-tight truncate">{username}</p>
            </div>
          )}
          {password && (
            <div>
              <p className="text-slate-500 text-[0.6vw] font-medium tracking-wide">Password</p>
              <p className="text-slate-900 text-[1vw] font-bold leading-tight font-mono truncate">{password}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
