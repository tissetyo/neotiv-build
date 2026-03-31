'use client';

import QRCode from 'react-qr-code';

interface Props {
  ssid: string;
  username: string;
  password: string;
}

export default function WifiCard({ ssid, username, password }: Props) {
  const wifiString = `WIFI:S:${ssid};T:WPA;P:${password};;`;

  return (
    <div className="tv-widget flex flex-col gap-[1vh] flex-1 min-h-[14vh] p-[1.5vh]">
      <div className="flex items-center gap-2">
        <span className="text-[1.2vw]">📶</span>
        <span className="text-white text-[1vw] font-semibold tv-text-shadow">Wifi Access</span>
      </div>
      <div className="flex gap-[1vw] items-center">
        <div className="bg-white p-2 rounded-lg flex-shrink-0 shadow-sm border border-slate-200">
          <QRCode value={wifiString} size={70} level="M" />
        </div>
        <div className="text-white space-y-[0.3vh]">
          <div><p className="text-white/70 text-[0.8vw] leading-none">SSID</p><p className="font-bold text-[1vw] tv-text-shadow leading-none">{ssid || 'HotelABC'}</p></div>
          <div><p className="text-white/70 text-[0.8vw] leading-none">Username</p><p className="font-bold text-[1vw] tv-text-shadow leading-none">{username || 'Guest'}</p></div>
          <div><p className="text-white/70 text-[0.8vw] leading-none">Password</p><p className="font-bold text-[1vw] tv-text-shadow leading-none">{password || 'stayinhereforw'}</p></div>
        </div>
      </div>
    </div>
  );
}
