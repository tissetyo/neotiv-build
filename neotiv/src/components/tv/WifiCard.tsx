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
    <div className="tv-widget flex gap-4 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[18px]">📶</span>
        <span className="text-white text-[16px] font-semibold">Wifi Access</span>
      </div>
      <div className="flex gap-4 items-start">
        <div className="bg-white p-2 rounded-lg flex-shrink-0">
          <QRCode value={wifiString} size={90} level="M" />
        </div>
        <div className="text-white text-[14px] space-y-1.5">
          <div><span className="text-white/50">SSID</span><br /><span className="font-bold text-[16px]">{ssid || 'HotelABC'}</span></div>
          <div><span className="text-white/50">Username</span><br /><span className="font-bold text-[16px]">{username || 'Guest'}</span></div>
          <div><span className="text-white/50">Password</span><br /><span className="font-bold text-[16px]">{password || 'stayinhereforwhile'}</span></div>
        </div>
      </div>
    </div>
  );
}
