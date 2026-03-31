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
    <div className="tv-widget flex-1 flex gap-[1.5vw] items-center p-[1.5vw]">
      <div className="bg-white p-[0.6vw] rounded-xl flex-shrink-0 shadow-lg border border-slate-200">
        <QRCode value={wifiString} size={110} level="H" />
      </div>
      <div className="text-white flex-1 min-w-0">
        <p className="text-[0.8vw] font-semibold tv-text-shadow mb-[0.3vh]">📶 WiFi Access</p>
        <div className="space-y-[0.2vh]">
          <p className="text-white/60 text-[0.65vw] leading-none">SSID: <span className="text-white font-semibold">{ssid}</span></p>
          <p className="text-white/60 text-[0.65vw] leading-none">User: <span className="text-white font-semibold">{username}</span></p>
          <p className="text-white/60 text-[0.65vw] leading-none">Pass: <span className="text-white font-semibold">{password}</span></p>
        </div>
      </div>
    </div>
  );
}
