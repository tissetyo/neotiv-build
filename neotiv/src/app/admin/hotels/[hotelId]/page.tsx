'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

interface Hotel {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

export default function HotelDetailPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = use(params);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roomCount, setRoomCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [hotelRes, staffRes, roomsRes, servicesRes] = await Promise.all([
        supabase.from('hotels').select('*').eq('id', hotelId).single(),
        supabase.from('staff').select('*').eq('hotel_id', hotelId).order('created_at'),
        supabase.from('rooms').select('id', { count: 'exact' }).eq('hotel_id', hotelId),
        supabase.from('services').select('id', { count: 'exact' }).eq('hotel_id', hotelId),
      ]);

      if (hotelRes.data) setHotel(hotelRes.data);
      if (staffRes.data) setStaff(staffRes.data);
      setRoomCount(roomsRes.count || 0);
      setServiceCount(servicesRes.count || 0);
      setLoading(false);
    };
    load();
  }, [hotelId, supabase]);

  const toggleHotelStatus = async () => {
    if (!hotel) return;
    const newStatus = !hotel.is_active;
    const action = newStatus ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} "${hotel.name}"?${!newStatus ? '\nAll staff will lose access.' : ''}`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        setHotel({ ...hotel, is_active: newStatus });
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!hotel) return;
    const confirmSlug = prompt(`Type "${hotel.slug}" to permanently delete this hotel:`);
    if (confirmSlug !== hotel.slug) return;

    setActionLoading(true);
    await supabase.from('hotels').delete().eq('id', hotelId);
    router.push('/admin/hotels');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hotel) {
    return <div className="text-center py-16 text-slate-400">Hotel not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/hotels')} className="text-slate-400 hover:text-slate-600 transition-colors">
          ← Hotels
        </button>
        <h1 className="text-2xl font-bold text-slate-800">{hotel.name}</h1>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          hotel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {hotel.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Slug', value: hotel.slug },
          { label: 'Location', value: hotel.location || '—' },
          { label: 'Timezone', value: hotel.timezone },
          { label: 'Created', value: new Date(hotel.created_at).toLocaleDateString() },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs text-slate-400 uppercase">{item.label}</p>
            <p className="text-sm font-medium text-slate-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-3xl font-bold text-slate-800">{roomCount}</p>
          <p className="text-sm text-slate-500 mt-1">Rooms</p>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-3xl font-bold text-slate-800">{staff.length}</p>
          <p className="text-sm text-slate-500 mt-1">Staff Members</p>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-3xl font-bold text-slate-800">{serviceCount}</p>
          <p className="text-sm text-slate-500 mt-1">Services</p>
        </div>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-slate-700">Staff Members</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-400 text-sm">No staff members</td></tr>
            ) : staff.map((s) => (
              <tr key={s.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-6 py-3 text-sm font-medium text-slate-800">{s.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-slate-500">{s.email || '—'}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold text-slate-700 mb-4">Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(`/${hotel.slug}/frontoffice`, '_blank')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-teal)' }}
          >
            Open Hotel Panel →
          </button>
          <button
            onClick={toggleHotelStatus}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              hotel.is_active ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {actionLoading ? '...' : hotel.is_active ? 'Deactivate Hotel' : 'Reactivate Hotel'}
          </button>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            Delete Hotel
          </button>
        </div>
      </div>
    </div>
  );
}
