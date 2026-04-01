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
    <div className="tv-widget-light h-full flex gap-[1vw] items-center tv-focusable" tabIndex={0}>
      <div className="bg-white p-[0.5vw] rounded-xl flex-shrink-0 border border-slate-200 shadow-sm">
        <QRCode value={wifiString} size={90} level="H" />
      </div>
      <div className="text-slate-900 flex-1 min-w-0">
        <p className="text-[0.7vw] font-bold mb-[0.6vh]">📶 WiFi Access</p>
        <div className="space-y-[0.4vh]">
          <div>
            <p className="text-slate-500 text-[0.5vw] uppercase tracking-wider font-semibold">SSID</p>
            <p className="text-slate-900 text-[0.7vw] font-bold">{ssid}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[0.5vw] uppercase tracking-wider font-semibold">Username</p>
            <p className="text-slate-900 text-[0.7vw] font-bold">{username}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[0.5vw] uppercase tracking-wider font-semibold">Password</p>
            <p className="text-slate-900 text-[0.7vw] font-bold">{password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
