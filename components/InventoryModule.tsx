import React, { useState } from 'react';
import { Box, Pencil, ArrowRightLeft, ArrowRight, AlertTriangle, Filter } from 'lucide-react';
import { InventoryItem, StockMove } from '../types';
import { db, appId, createStockMove } from '../services/firebase';
import { updateDoc, doc } from 'firebase/firestore';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  userId: string;
  stockMoves: StockMove[];
  formatMMK: (val: number | string) => string;
}

const MasterTabBtn = ({ id, label, icon: Icon, active, set }: any) => (
  <button onClick={() => set(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${active === id ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}><Icon size={16} /> {label}</button>
);

export const InventoryModule: React.FC<InventoryModuleProps> = ({ inventory, userId, stockMoves, formatMMK }) => {
  const [view, setView] = useState('stock');
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  
  // Low Stock Config
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === '' || !adjustReason) return;
    if (!window.confirm("Confirm Stock Adjustment?")) return;

    const newStock = parseInt(adjustQty);
    const diff = newStock - (adjustItem.stock || 0);
    if (diff === 0) return alert("Same qty");

    try {
      if (!adjustItem.id.startsWith('demo-')) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'inventory', adjustItem.id), { stock: newStock });
        const locationAdj = "Virtual Locations/Inventory Adjustment";
        const locationStock = "WH/Stock";
        await createStockMove(userId, {
          productId: adjustItem.id, productName: adjustItem.name, qty: Math.abs(diff),
          from: diff > 0 ? locationAdj : locationStock,
          to: diff > 0 ? locationStock : locationAdj,
          ref: adjustReason
        });
      }
      setAdjustItem(null); setAdjustQty(''); setAdjustReason(''); alert("Stock Adjusted");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <MasterTabBtn id="stock" label="Current Stock" icon={Box} active={view} set={setView} />
        <MasterTabBtn id="adjust" label="Adjustments" icon={Pencil} active={view} set={setView} />
        <MasterTabBtn id="moves" label="Stock Moves" icon={ArrowRightLeft} active={view} set={setView} />
      </div>

      {view === 'stock' && (
        <div className="flex flex-col h-full">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 mb-3 flex flex-col gap-3 transition-colors shadow-sm">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                   <AlertTriangle size={14} className="text-amber-500" /> 
                   Low Stock Threshold
                </label>
                <div className="flex items-center gap-2">
                   <input 
                     type="number" 
                     value={lowStockThreshold} 
                     onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                     className="w-16 p-1.5 text-center text-xs font-bold border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                   />
                   <span className="text-[10px] text-slate-400 dark:text-slate-500">Units</span>
                </div>
             </div>
             <button 
               onClick={() => setShowLowStockOnly(!showLowStockOnly)}
               className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${showLowStockOnly ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-transparent'}`}
             >
               <Filter size={14} />
               {showLowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock Items'}
             </button>
          </div>

          <div className="space-y-2 pb-20 overflow-y-auto">
            {inventory
              .filter(i => i.type !== 'Service')
              .filter(i => !showLowStockOnly || (i.stock || 0) < lowStockThreshold)
              .map(i => {
                const isLowStock = (i.stock || 0) < lowStockThreshold;
                return (
                  <div key={i.id} className={`p-3 rounded-xl border flex justify-between items-center transition-colors ${isLowStock ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                        {i.name}
                        {isLowStock && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{i.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold text-lg ${isLowStock ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{i.stock}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Units</span>
                    </div>
                  </div>
                );
            })}
            {inventory.filter(i => i.type !== 'Service' && (!showLowStockOnly || (i.stock || 0) < lowStockThreshold)).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                    <Box size={32} className="mb-2 opacity-20" />
                    <p>{showLowStockOnly ? "No items below threshold." : "No inventory items found."}</p>
                </div>
            )}
          </div>
        </div>
      )}

      {view === 'adjust' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 mb-4 transition-colors">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">New Adjustment</h3>
            <form onSubmit={handleAdjust} className="space-y-3">
              <select className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={adjustItem ? adjustItem.id : ''} onChange={e => {const item = inventory.find(i => i.id === e.target.value) || null; setAdjustItem(item); setAdjustQty(item ? String(item.stock) : '');}}>
                <option value="">Select Product</option>
                {inventory.filter(i => i.type !== 'Service').map(i => <option key={i.id} value={i.id}>{i.name} (Cur: {i.stock})</option>)}
              </select>
              <div className="flex gap-2"><input type="number" className="w-1/3 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="New Qty" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} /><input type="text" className="flex-1 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Reason" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} /></div>
              <button className="w-full bg-amber-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors">Update Stock</button>
            </form>
          </div>
        </div>
      )}

      {view === 'moves' && (
        <div className="space-y-2 pb-20 overflow-y-auto">
          {stockMoves.map(m => (
            <div key={m.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 text-sm shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(m.timestamp?.seconds*1000).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{m.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                 <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{m.productName}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900 p-1 rounded border border-slate-100 dark:border-slate-700 inline-flex">
                      <span className="truncate max-w-[100px]">{m.locationId}</span>
                      <ArrowRight size={10} />
                      <span className="truncate max-w-[100px]">{m.locationDestId}</span>
                    </div>
                 </div>
                 <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{m.qty}</span>
              </div>
            </div>
          ))}
          {stockMoves.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500 mt-10">No stock movements found.</p>}
        </div>
      )}
    </div>
  );
};