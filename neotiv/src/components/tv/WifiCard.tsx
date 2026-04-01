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
    <div className="tv-widget h-full flex gap-[1vw] items-center tv-focusable" tabIndex={0}>
      <div className="bg-white p-[0.5vw] rounded-xl flex-shrink-0 shadow-lg">
        <QRCode value={wifiString} size={90} level="H" />
      </div>
      <div className="text-white flex-1 min-w-0">
        <p className="text-[0.7vw] font-semibold tv-text-shadow mb-[0.6vh]">📶 WiFi Access</p>
        <div className="space-y-[0.4vh]">
          <div>
            <p className="text-white/40 text-[0.5vw] uppercase tracking-wider">SSID</p>
            <p className="text-white text-[0.7vw] font-semibold">{ssid}</p>
          </div>
          <div>
            <p className="text-white/40 text-[0.5vw] uppercase tracking-wider">Username</p>
            <p className="text-white text-[0.7vw] font-semibold">{username}</p>
          </div>
          <div>
            <p className="text-white/40 text-[0.5vw] uppercase tracking-wider">Password</p>
            <p className="text-white text-[0.7vw] font-semibold">{password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
