'use client';

import { useState, useEffect, use } from 'react';
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit2, Utensils, Car, Shirt, Coffee, Sparkles, Scissors, ShoppingBag, Map, Briefcase, Bell, Check, X } from 'lucide-react';
import type { Service, ServiceOption } from '@/types';

// Standard icon library mapping for Lucide icons
const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Scissors: <Scissors className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Map: <Map className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />
};

export default function ServicesConfigPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = use(params);
  const [hotelId, setHotelId] = useState<string | null>(null);
  
  // States mapping Categories (Services)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Bell');

  // States mapping Items (Options)
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
      if (data) setHotelId(data.id);
    }
    init();
  }, [hotelSlug]);

  const { data: services = [], mutate: mutateServices } = useSWR(
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

  const { data: options = [], mutate: mutateOptions } = useSWR(
    selectedServiceId ? `options-${selectedServiceId}` : null,
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('service_options').select('*').eq('service_id', selectedServiceId);
      return data as ServiceOption[] || [];
    }
  );

  // -- Category Handlers --
  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !hotelId) return;
    const supabase = createBrowserClient();
    const { data } = await supabase.from('services').insert({
      hotel_id: hotelId,
      name: newCatName,
      icon: newCatIcon,
      sort_order: services.length,
      is_active: true
    }).select().single();
    
    if (data) {
      setSelectedServiceId(data.id);
    }
    setNewCatName('');
    setIsAddingCategory(false);
    mutateServices();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Entire Category? All packages inside will be lost.')) return;
    const supabase = createBrowserClient();
    await supabase.from('services').delete().eq('id', id);
    if (selectedServiceId === id) setSelectedServiceId('');
    mutateServices();
  };

  // -- Options Handlers --
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
    mutateOptions();
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option package?')) return;
    const supabase = createBrowserClient();
    await supabase.from('service_options').delete().eq('id', id);
    mutateOptions();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  if (!hotelId) return <div className="p-8 text-slate-400">Loading Configuration...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hotel Services & Packages</h1>
          <p className="text-slate-500 text-sm mt-1">Configure the main service categories and their associated package items/prices.</p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* === Categories Sidebar === */}
        <div className="w-[320px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
             <h2 className="font-bold text-slate-800">Categories</h2>
             {!isAddingCategory && (
               <button onClick={() => setIsAddingCategory(true)} className="text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors">
                 <Plus className="w-5 h-5" />
               </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {/* Add New Category Mode */}
             {isAddingCategory && (
               <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                 <h3 className="text-xs font-bold text-teal-800 uppercase tracking-widest mb-3">New Category</h3>
                 <input 
                   type="text" 
                   value={newCatName} 
                   onChange={e => setNewCatName(e.target.value)} 
                   placeholder="e.g. Spa & Massage" 
                   className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white mb-3 outline-none focus:ring-2 focus:ring-teal-500" 
                 />
                 
                 <div className="mb-3">
                   <p className="text-xs text-slate-500 font-semibold mb-2">Select Icon Library:</p>
                   <div className="flex flex-wrap gap-2">
                     {Object.entries(ICONS).map(([name, iconCmp]) => (
                       <button 
                         key={name}
                         onClick={() => setNewCatIcon(name)}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                           newCatIcon === name ? 'bg-teal-500 text-white shadow-md' : 'bg-white border text-slate-400 hover:bg-slate-100'
                         }`}
                         title={name}
                       >
                         {iconCmp}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="flex gap-2">
                   <button onClick={handleCreateCategory} disabled={!newCatName} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-teal-700 disabled:opacity-50">
                     <Check className="w-4 h-4" /> Save
                   </button>
                   <button onClick={() => setIsAddingCategory(false)} className="px-3 bg-white border text-slate-500 rounded-lg hover:bg-slate-50 transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             )}

             {services.map(s => {
               // Handle legacy emoji icons gracefully or fallbacks
               const SafeIcon = ICONS[s.icon || ''] || <span className="text-lg leading-none">{s.icon || '🛎️'}</span>;
               
               return (
                 <button 
                   key={s.id} 
                   onClick={() => setSelectedServiceId(s.id)}
                   className={`w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl transition-all border group ${
                     selectedServiceId === s.id 
                     ? 'bg-gradient-to-r from-teal-500 to-teal-600 border-teal-500 text-white shadow-md font-semibold' 
                     : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:shadow-sm'
                   }`}
                 >
                   <div className="flex items-center">
                     <span className={`mr-3 p-1.5 rounded-lg ${selectedServiceId === s.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                       {SafeIcon}
                     </span>
                     {s.name}
                   </div>
                   
                   <span 
                     onClick={(e) => { e.stopPropagation(); handleDeleteCategory(s.id); }}
                     className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${
                       selectedServiceId === s.id ? 'hover:bg-red-500/50 text-white' : 'hover:bg-red-50 text-red-500'
                     }`}
                     title="Delete Category"
                   >
                     <Trash2 className="w-4 h-4" />
                   </span>
                 </button>
               );
             })}
             
             {services.length === 0 && !isAddingCategory && (
                <div className="p-6 text-center text-slate-400 text-sm border rounded-xl border-dashed">
                  No service categories yet. Click + to make one!
                </div>
             )}
          </div>
        </div>

        {/* === Options & Packages Editor === */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           {selectedServiceId ? (
             <>
               <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800 text-xl flex items-center gap-3">
                      {ICONS[services.find(s => s.id === selectedServiceId)?.icon || ''] || ''}
                      {services.find(s => s.id === selectedServiceId)?.name} 
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Configure all packages available under this category.</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {/* Add New Package Form */}
                  <div className="flex gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                     <div className="flex-1">
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Package / Item Name</label>
                       <input type="text" value={newOptionName} onChange={e => setNewOptionName(e.target.value)} placeholder="e.g. Signature Massage (60 mins)" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-teal-500 outline-none transition-colors" />
                     </div>
                     <div className="w-56">
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (IDR)</label>
                       <div className="relative">
                         <span className="absolute left-4 top-3 text-slate-400 font-semibold text-sm">Rp</span>
                         <input type="number" value={newOptionPrice} onChange={e => setNewOptionPrice(e.target.value)} placeholder="250000" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-teal-500 outline-none transition-colors" />
                       </div>
                     </div>
                     <div className="flex items-end">
                       <button onClick={handleCreateOption} disabled={!newOptionName || !newOptionPrice} className="h-[46px] px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md">
                         <Plus className="w-4 h-4" /> Add Package
                       </button>
                     </div>
                  </div>

                  {/* List of Options */}
                  <div className="space-y-3">
                     {options.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-slate-100 border-dashed rounded-2xl">
                          <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                           <p className="text-slate-500 font-medium">This category has no packages mapped to it.</p>
                           <p className="text-slate-400 text-sm mt-1">Use the form above to stock it.</p>
                        </div>
                     ) : (
                        options.map(opt => (
                           <div key={opt.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-teal-300 hover:shadow-md transition-all group">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                  {opt.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{opt.name}</h3>
                                  <p className="text-teal-600 font-bold mt-1 text-sm bg-teal-50 inline-block px-2 py-0.5 rounded-md">{formatRupiah(opt.price)}</p>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteOption(opt.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        ))
                     )}
                  </div>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
               <Map className="w-16 h-16 text-slate-200 mb-4" />
               <p className="font-medium text-lg">No Category Selected</p>
               <p className="text-sm mt-1 max-w-sm text-center">Select a category from the left sidebar or create one to start mapping prices.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
