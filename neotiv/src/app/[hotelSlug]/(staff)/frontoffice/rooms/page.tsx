'use client';

import { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Settings, Calendar, User, KeyRound, MessageSquare, X, Save, Monitor } from 'lucide-react';
import type { Room } from '@/types';

export default function RoomsPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Quick Edit Sidebar State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);

  // STB Pairing State
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairCode, setPairCode] = useState('');
  const [pairLoading, setPairLoading] = useState(false);
  const [pairResult, setPairResult] = useState<'success' | 'error' | null>(null);
  const [pairError, setPairError] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const supabase = createBrowserClient();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) { setLoading(false); return; }

    const { data } = await supabase
      .from('rooms')
      .select('*, room_types(name)')
      .eq('hotel_id', hotel.id)
      .order('room_code');

    setRooms(data || []);
    setLoading(false);
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;
    setSaving(true);
    const supabase = createBrowserClient();
    
    // Auto-set occupied if name exists but wasn't manually toggled
    const finalRoom = { ...editingRoom };
    if (finalRoom.guest_name && !finalRoom.is_occupied) finalRoom.is_occupied = true;
    if (!finalRoom.guest_name && finalRoom.is_occupied) finalRoom.is_occupied = false;

    const { error } = await supabase.from('rooms').update({
      guest_name: finalRoom.guest_name || null,
      custom_welcome_message: finalRoom.custom_welcome_message || null,
      checkin_date: finalRoom.checkin_date || null,
      checkout_date: finalRoom.checkout_date || null,
      pin: finalRoom.pin || null,
      is_occupied: finalRoom.is_occupied
    }).eq('id', finalRoom.id);

    if (!error) {
      setRooms(rooms.map(r => r.id === finalRoom.id ? finalRoom : r));
      setEditingRoom(null);
    }
    setSaving(false);
  };

  const handlePairSTB = async () => {
    if (!pairCode.trim() || !editingRoom) return;
    setPairLoading(true);
    setPairResult(null);
    setPairError('');
    try {
      const res = await fetch('/api/stb/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pairCode.trim().toUpperCase(),
          hotelSlug,
          roomCode: editingRoom.room_code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPairResult('success');
      setTimeout(() => {
        setShowPairModal(false);
        setPairCode('');
        setPairResult(null);
      }, 3000);
    } catch (err: any) {
      setPairResult('error');
      setPairError(err.message || 'Failed to pair');
    }
    setPairLoading(false);
  };

  const toggleOccupancy = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    const isOccupied = !room.is_occupied;
    setRooms(rooms.map(r => r.id === room.id ? { ...r, is_occupied: isOccupied, guest_name: isOccupied ? r.guest_name : '' } : r));
    
    const supabase = createBrowserClient();
    supabase.from('rooms').update({ 
      is_occupied: isOccupied, 
      guest_name: isOccupied ? room.guest_name : null,
      checkin_date: isOccupied ? room.checkin_date : null,
      checkout_date: isOccupied ? room.checkout_date : null
    }).eq('id', room.id).then();
  };

  const filtered = rooms.filter(r => {
    if (filter === 'occupied' && !r.is_occupied) return false;
    if (filter === 'vacant' && r.is_occupied) return false;
    if (search && !r.room_code.includes(search) && !r.guest_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] relative">
      <div className={`flex-1 transition-all duration-300 ${editingRoom ? 'mr-[420px]' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Room Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Manage guest check-ins, TV access PINs, and checkout dates.</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search room or guest..." value={search} onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500" style={{ borderColor: 'var(--color-border)' }} />
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
              {(['all', 'occupied', 'vacant'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm capitalize transition-colors ${filter === f ? 'bg-teal-500 text-white font-semibold' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-5 text-slate-400">Loading Configuration...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl">
            <p className="text-4xl mb-2">🏨</p>
            <p className="text-slate-500 font-medium">No rooms match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 xl:grid-cols-4 content-start items-start gap-5 overflow-y-auto pb-10 hide-scrollbar h-full">
            {filtered.map(room => (
              <div 
                key={room.id} 
                onClick={() => setEditingRoom({ ...room })}
                className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden group ${
                  editingRoom?.id === room.id ? 'border-teal-500 ring-4 ring-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300 hover:shadow-sm'
                }`} 
              >
                {room.is_occupied && <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 opacity-50 rounded-bl-full pointer-events-none"></div>}
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">Room {room.room_code}</span>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">{room.room_types?.name || 'Standard'}</p>
                  </div>
                  <button onClick={(e) => toggleOccupancy(e, room)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${room.is_occupied ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {room.is_occupied ? 'OCCUPIED' : 'VACANT'}
                  </button>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center text-sm text-slate-600">
                     <User className="w-4 h-4 mr-2 opacity-50" />
                     {room.guest_name ? <span className="font-semibold text-slate-800">{room.guest_name}</span> : <span className="text-slate-400 italic">No Guest</span>}
                  </div>
                  {(room.checkin_date || room.checkout_date) && (
                    <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1.5 rounded-md w-fit">
                       <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60 text-indigo-500" />
                       {room.checkin_date ? new Date(room.checkin_date).toLocaleDateString() : 'TBD'} 
                       <span className="mx-1 text-slate-300">→</span> 
                       {room.checkout_date ? new Date(room.checkout_date).toLocaleDateString() : 'TBD'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Side Panel */}
      {editingRoom && (
        <div className="absolute right-0 top-0 w-[400px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right-10 rounded-2xl overflow-hidden z-20">
           <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
             <div>
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                 <Settings className="w-5 h-5 text-teal-600" /> 
                 Configure Room {editingRoom.room_code}
               </h2>
               <p className="text-xs text-slate-500 mt-1">Changes sync instantly to the TV Dashboard.</p>
             </div>
             <button onClick={() => setEditingRoom(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Guest Name</label>
                <input 
                  type="text" 
                  value={editingRoom.guest_name || ''} 
                  onChange={e => setEditingRoom({...editingRoom, guest_name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Welcome Message</label>
                <textarea 
                  rows={2}
                  value={editingRoom.custom_welcome_message || ''} 
                  onChange={e => setEditingRoom({...editingRoom, custom_welcome_message: e.target.value})}
                  placeholder="Welcome to Amartha Hotel!"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition-colors resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Appears prominently on the TV Dashboard home screen.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-in Date</label>
                    <input 
                      type="date" 
                      value={editingRoom.checkin_date || ''} 
                      onChange={e => setEditingRoom({...editingRoom, checkin_date: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Check-out Date</label>
                    <input 
                      type="date" 
                      value={editingRoom.checkout_date || ''} 
                      onChange={e => setEditingRoom({...editingRoom, checkout_date: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-400 outline-none text-rose-600 font-semibold"
                    />
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><KeyRound className="w-3.5 h-3.5" /> TV Access PIN</label>
                <input 
                  type="text" 
                  value={editingRoom.pin || ''} 
                  onChange={e => setEditingRoom({...editingRoom, pin: e.target.value})}
                  placeholder="Optional 4-digit PIN"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none font-mono tracking-widest text-lg"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">If set, guests must enter this PIN to unlock the TV Dashboard.</p>
              </div>

              {/* Pair STB Button */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" /> Set-Top Box
                </label>
                <button
                  onClick={() => { setShowPairModal(true); setPairCode(''); setPairResult(null); setPairError(''); }}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-200"
                >
                  <Monitor className="w-4 h-4" /> 📺 Pair STB to This Room
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">Link a set-top box showing a QR pairing code to this room.</p>
              </div>

           </div>

           <div className="p-5 border-t border-slate-100 bg-white">
              <button 
                onClick={handleSaveRoom}
                disabled={saving}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
           </div>
        </div>
      )}

      {/* STB Pairing Modal */}
      {showPairModal && editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                    Pair STB — Room {editingRoom.room_code}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Enter the 6-character code shown on the TV screen</p>
                </div>
                <button onClick={() => setShowPairModal(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Step by step guide */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Setup Steps</p>
                <div className="space-y-2">
                  {[
                    { n: 1, text: 'On the STB, open your Neotiv domain in browser', done: true },
                    { n: 2, text: 'Click "Set-Top Box Setup" → "Start QR Pairing"', done: true },
                    { n: 3, text: 'Enter the 6-character code shown on screen below', done: false },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        s.done ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>{s.n}</div>
                      <span className={`text-sm ${s.done ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Input */}
              <div className="mb-5">
                <input
                  type="text"
                  value={pairCode}
                  onChange={e => setPairCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                  className="w-full px-6 py-4 text-center text-2xl font-bold font-mono tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter' && pairCode.length === 6) handlePairSTB(); }}
                />
                <p className="text-center text-xs text-slate-400 mt-2">
                  {pairCode.length}/6 characters
                </p>
              </div>

              {/* Result messages */}
              {pairResult === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">STB Paired Successfully!</p>
                    <p className="text-xs text-emerald-600">The TV will now load Room {editingRoom.room_code}&apos;s dashboard</p>
                  </div>
                </div>
              )}

              {pairResult === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="font-bold text-red-800 text-sm">Pairing Failed</p>
                  <p className="text-xs text-red-600">{pairError || 'Invalid or expired code. Check the TV screen and try again.'}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPairModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePairSTB}
                  disabled={pairLoading || pairCode.length < 6 || pairResult === 'success'}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {pairLoading ? '⏳ Pairing...' : pairResult === 'success' ? '✓ Done' : '📺 Pair Device'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
