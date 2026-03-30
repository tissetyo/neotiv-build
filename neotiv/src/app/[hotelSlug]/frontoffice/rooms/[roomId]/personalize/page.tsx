'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

interface Room {
  id: string;
  room_code: string;
  guest_name: string | null;
  guest_photo_url: string | null;
  custom_welcome_message: string | null;
  background_url: string | null;
  is_occupied: boolean;
  checkin_date: string | null;
  checkout_date: string | null;
}

export default function PersonalizePage({ params }: { params: Promise<{ hotelSlug: string; roomId: string }> }) {
  const { hotelSlug, roomId } = use(params);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Form state
  const [guestName, setGuestName] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [isOccupied, setIsOccupied] = useState(false);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');

  useEffect(() => {
    const loadRoom = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (data) {
        setRoom(data);
        setGuestName(data.guest_name || '');
        setWelcomeMsg(data.custom_welcome_message || '');
        setIsOccupied(data.is_occupied || false);
        setCheckinDate(data.checkin_date || '');
        setCheckoutDate(data.checkout_date || '');
      }
      setLoading(false);
    };
    loadRoom();
  }, [roomId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('rooms').update({
      guest_name: guestName.trim() || null,
      custom_welcome_message: welcomeMsg.trim() || null,
      is_occupied: isOccupied,
      checkin_date: checkinDate || null,
      checkout_date: checkoutDate || null,
    }).eq('id', roomId);

    setSaving(false);
    if (!error) {
      setToast('Room updated. TV dashboard will reflect changes.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!room) {
    return <div className="text-center py-16 text-slate-400">Room not found</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/${hotelSlug}/frontoffice/rooms`)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          Room {room.room_code} — Guest Personalization
        </h1>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm">
          ✅ {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
        {/* Guest Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Guest Name</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Mr. Stephen Hawk"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custom Welcome Message</label>
          <textarea
            value={welcomeMsg}
            onChange={(e) => setWelcomeMsg(e.target.value)}
            placeholder="Optional override for the welcome screen"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none resize-none"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <p className="text-xs text-slate-400 mt-1">Leave empty to use the default welcome message.</p>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Room Status</label>
          <div className="flex gap-3">
            <button
              onClick={() => setIsOccupied(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isOccupied ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-slate-100 text-slate-500'
              }`}
            >
              Occupied
            </button>
            <button
              onClick={() => setIsOccupied(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isOccupied ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-100 text-slate-500'
              }`}
            >
              Vacant
            </button>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Date</label>
            <input
              type="date"
              value={checkinDate}
              onChange={(e) => setCheckinDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Date</label>
            <input
              type="date"
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
        </div>

        {/* Guest Photo (placeholder — needs upload API) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Guest Photo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl overflow-hidden">
              {room.guest_photo_url ? (
                <img src={room.guest_photo_url} alt="Guest" className="w-full h-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <div className="text-sm text-slate-400">
              Photo upload will be available once Supabase Storage is configured.
            </div>
          </div>
        </div>

        {/* Background Image */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Room Background</label>
          <div className="text-sm text-slate-400">
            {room.background_url ? (
              <div className="flex items-center gap-3">
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-100">
                  <img src={room.background_url} alt="Background" className="w-full h-full object-cover" />
                </div>
                <span>Custom background set</span>
              </div>
            ) : (
              <span>Using hotel default background. Upload via Hotel Settings → Appearance.</span>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50"
            style={{ background: 'var(--color-teal)' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
