'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  room_count?: number;
}

export default function RoomTypesPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createBrowserClient();

  const loadRoomTypes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const hotelId = user?.user_metadata?.hotel_id;
    if (!hotelId) return;

    const { data: types } = await supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');

    // Get room counts
    const { data: rooms } = await supabase
      .from('rooms')
      .select('room_type_id')
      .eq('hotel_id', hotelId);

    const counts: Record<string, number> = {};
    rooms?.forEach((r) => {
      if (r.room_type_id) counts[r.room_type_id] = (counts[r.room_type_id] || 0) + 1;
    });

    setRoomTypes((types || []).map((t) => ({ ...t, room_count: counts[t.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { loadRoomTypes(); }, []);

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const hotelId = user?.user_metadata?.hotel_id;

    await supabase.from('room_types').insert({
      hotel_id: hotelId,
      name: formName.trim(),
      description: formDesc.trim() || null,
    });

    setFormName(''); setFormDesc(''); setShowAdd(false); setSaving(false);
    loadRoomTypes();
  };

  const handleEdit = async (id: string) => {
    setSaving(true);
    await supabase.from('room_types').update({
      name: formName.trim(),
      description: formDesc.trim() || null,
    }).eq('id', id);

    setEditingId(null); setFormName(''); setFormDesc(''); setSaving(false);
    loadRoomTypes();
  };

  const handleDelete = async (rt: RoomType) => {
    if ((rt.room_count || 0) > 0) {
      alert(`Cannot delete "${rt.name}" — ${rt.room_count} rooms are assigned to this type. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete room type "${rt.name}"?`)) return;
    await supabase.from('room_types').delete().eq('id', rt.id);
    loadRoomTypes();
  };

  const startEdit = (rt: RoomType) => {
    setEditingId(rt.id);
    setFormName(rt.name);
    setFormDesc(rt.description || '');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Room Types</h1>
        <button
          onClick={() => { setShowAdd(true); setFormName(''); setFormDesc(''); }}
          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
          style={{ background: 'var(--color-teal)' }}
        >
          + Add Room Type
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-slate-700 mb-4">New Room Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Deluxe Sea View"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Description</label>
              <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={saving || !formName.trim()} className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ background: 'var(--color-teal)' }}>
              {saving ? 'Saving...' : 'Create'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-slate-600 text-sm bg-slate-100 hover:bg-slate-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Rooms</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : roomTypes.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No room types yet. Add one above.</td></tr>
            ) : roomTypes.map((rt) => (
              <tr key={rt.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-6 py-4">
                  {editingId === rt.id ? (
                    <input value={formName} onChange={(e) => setFormName(e.target.value)}
                      className="px-2 py-1 border rounded text-sm focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
                  ) : (
                    <span className="font-medium text-slate-800">{rt.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {editingId === rt.id ? (
                    <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                      className="px-2 py-1 border rounded text-sm w-full focus:border-teal-400 focus:outline-none" style={{ borderColor: 'var(--color-border)' }} />
                  ) : (
                    rt.description || '—'
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {rt.room_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === rt.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleEdit(rt.id)} disabled={saving} className="text-sm text-teal-600 hover:underline">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-slate-400 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => startEdit(rt)} className="text-sm text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(rt)} className="text-sm text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
