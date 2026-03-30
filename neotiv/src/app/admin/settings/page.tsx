'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('We are currently under maintenance.');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Platform Settings</h1>
      <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Maintenance Mode</h2>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-rose-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${maintenanceMode ? 'text-rose-500' : 'text-slate-500'}`}>
            {maintenanceMode ? 'ON' : 'OFF'}
          </span>
        </div>
        <textarea value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} rows={3}
          className="w-full max-w-lg px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }} />
        {maintenanceMode && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            ⚠️ Maintenance mode is ON. All TV dashboards will show the maintenance message.
          </div>
        )}
      </div>
    </div>
  );
}
