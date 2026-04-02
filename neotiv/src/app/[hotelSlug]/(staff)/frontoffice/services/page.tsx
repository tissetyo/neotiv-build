'use client';

import { useState, useEffect, use } from 'react';
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase/client';
import { Plus, Trash2 } from 'lucide-react';
import type { Service, ServiceOption } from '@/types';

export default function ServicesConfigPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [hotelId, setHotelId] = useState<string | null>(null);
  
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
      if (data) setHotelId(data.id);
    }
    init();
  }, [hotelSlug]);

  const { data: services = [] } = useSWR(
    hotelId ? `services-${hotelId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('services').select('*').eq('hotel_id', hotelId).order('sort_order');
      if (data && data.length > 0 && !selectedServiceId) {
         setSelectedServiceId(data[0].id);
      }
      return data as Service[] || [];
    }
  );

  const { data: options = [], mutate } = useSWR(
    selectedServiceId ? `options-${selectedServiceId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('service_options').select('*').eq('service_id', selectedServiceId);
      return data as ServiceOption[] || [];
    }
  );

  const handleCreateOption = async () => {
    if (!newOptionName.trim() || !newOptionPrice || !selectedServiceId) return;
    const supabase = createBrowserClient();
    await supabase.from('service_options').insert({
      service_id: selectedServiceId,
      name: newOptionName,
      price: parseInt(newOptionPrice, 10) || 0
    });
    setNewOptionName('');
    setNewOptionPrice('');
    mutate();
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;
    const supabase = createBrowserClient();
    await supabase.from('service_options').delete().eq('id', id);
    mutate();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  if (!hotelId) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hotel Services Catalog</h1>
        <p className="text-slate-500 text-sm mt-1">Manage the items and prices available for guests to order on their mobile portal.</p>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-1/3 space-y-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest pl-2 mb-4">Categories</h2>
          {services.map(s => (
             <button 
               key={s.id} 
               onClick={() => setSelectedServiceId(s.id)}
               className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                 selectedServiceId === s.id 
                 ? 'bg-teal-50 border border-teal-200 text-teal-800 shadow-sm font-semibold' 
                 : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
               }`}
             >
               <span className="mr-3">{s.icon}</span>
               {s.name}
             </button>
          ))}
          {services.length === 0 && (
             <div className="p-4 text-center text-slate-400 text-sm bg-white border rounded-xl border-dashed">
               No categories. Add them in Management Settings.
             </div>
          )}
        </div>

        {/* Options Editor */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">
                 {services.find(s => s.id === selectedServiceId)?.name || 'Select a Category'} Items
              </h2>
           </div>

           <div className="p-6">
              {/* Add New Form */}
              <div className="flex gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                 <div className="flex-1">
                   <label className="block text-xs font-semibold text-slate-500 mb-1">Item Name</label>
                   <input type="text" value={newOptionName} onChange={e => setNewOptionName(e.target.value)} placeholder="e.g. Margherita Pizza" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:border-teal-500 outline-none" />
                 </div>
                 <div className="w-48">
                   <label className="block text-xs font-semibold text-slate-500 mb-1">Price (IDR)</label>
                   <input type="number" value={newOptionPrice} onChange={e => setNewOptionPrice(e.target.value)} placeholder="150000" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:border-teal-500 outline-none" />
                 </div>
                 <div className="flex items-end">
                   <button onClick={handleCreateOption} disabled={!newOptionName || !newOptionPrice} className="h-[38px] px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
                     <Plus className="w-4 h-4" /> Add Item
                   </button>
                 </div>
              </div>

              {/* List */}
              <div className="space-y-3">
                 {options.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                       No items in this category yet.
                    </div>
                 ) : (
                    options.map(opt => (
                       <div key={opt.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-teal-100 transition-colors group">
                          <div>
                            <h3 className="font-semibold text-slate-800">{opt.name}</h3>
                            <p className="text-teal-600 font-semibold text-sm mt-0.5">{formatRupiah(opt.price)}</p>
                          </div>
                          <button onClick={() => handleDeleteOption(opt.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
