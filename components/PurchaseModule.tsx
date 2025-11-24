import React, { useState } from 'react';
import { ArrowDownCircle, Search, X } from 'lucide-react';
import { InventoryItem, Purchase, Partner, ChartOfAccount } from '../types';
import { db, appId, createStockMove } from '../services/firebase';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface PurchaseModuleProps {
  inventory: InventoryItem[];
  userId: string;
  purchases: Purchase[];
  partners: Partner[];
  coa: ChartOfAccount[];
  formatMMK: (val: number | string) => string;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ inventory, userId, purchases, partners, coa, formatMMK }) => {
  const [view, setView] = useState('new'); 
  const [vendorName, setVendorName] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const paymentAccounts = coa.filter(c => c.type === 'payment') || [];
  const [paymentAccount, setPaymentAccount] = useState(paymentAccounts[0]?.code || '1020');

  const addLine = (item: InventoryItem) => {
    setLines(prev => {
      const exists = prev.find(l => l.id === item.id);
      if (exists) return prev.map(l => l.id === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { ...item, qty: 1, cost: item.cost || 0 }];
    });
    setSearch('');
  };

  const updateLine = (id: string, field: string, val: any) => { setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l)); };
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
  const total = lines.reduce((a, b) => a + (b.cost * b.qty), 0);

  const createPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 || !vendorName) return alert("Missing details");
    if (!window.confirm("Confirm Purchase Order? This will update stock.")) return;

    try {
      const poRef = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'purchase_orders'), {
        vendor: vendorName, date: poDate, items: lines, total, paymentAccount, timestamp: serverTimestamp()
      });

      for (const line of lines) {
        if (line.type !== 'Service' && !line.id.startsWith('demo-')) {
          await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'inventory', line.id), { stock: (line.stock || 0) + parseInt(line.qty) });
          await createStockMove(userId, {
            productId: line.id, productName: line.name, qty: line.qty,
            from: 'Partner Locations/Vendors', to: 'WH/Stock', ref: `PO ${poRef.id.slice(0,4)}`
          });
        }
      }
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'expenses'), {
        amount: total, description: `PO from ${vendorName}`, accountCode: '5000', 
        paymentMethods: [{ accountId: paymentAccount, amount: total }], timestamp: serverTimestamp()
      });
      setLines([]); setVendorName(''); alert("PO Created!");
    } catch (err) { console.error(err); alert("Error creating PO"); }
  };

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col">
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 transition-colors">
        <button onClick={() => setView('new')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${view === 'new' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>New PO</button>
        <button onClick={() => setView('history')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${view === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>History</button>
      </div>
      {view === 'new' ? (
        <form onSubmit={createPO} className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-700 dark:text-slate-100 flex gap-2"><ArrowDownCircle size={20}/> Purchase Order</h3><div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatMMK(total)}</div></div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Vendor</label><select className="w-full p-2 border dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={vendorName} onChange={e => setVendorName(e.target.value)}><option value="">Select Vendor</option>{partners.filter(p => p.type === 'Vendor').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
              <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Date</label><input type="date" className="w-full p-2 border dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={poDate} onChange={e => setPoDate(e.target.value)} /></div>
            </div>
            <div className="relative"><Search size={16} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"/><input className="w-full pl-9 p-2 border dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400" placeholder="Search Product to Add..." value={search} onChange={e => setSearch(e.target.value)} />{search && (<div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl z-10 rounded-xl mt-1 max-h-40 overflow-y-auto">{filteredItems.map(i => (<button key={i.id} type="button" onClick={() => addLine(i)} className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b dark:border-slate-700 text-slate-700 dark:text-slate-200">{i.name}</button>))}</div>)}</div>
            <div className="space-y-2">{lines.map(l => (<div key={l.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-700"><div className="flex-1"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{l.name}</p><input type="number" className="w-20 p-1 text-xs border dark:border-slate-600 rounded mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" placeholder="Cost" value={l.cost} onChange={e => updateLine(l.id, 'cost', parseFloat(e.target.value))} /></div><div className="flex items-center gap-2"><input type="number" className="w-12 p-1 text-center text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" value={l.qty} onChange={e => updateLine(l.id, 'qty', parseFloat(e.target.value))} /><button type="button" onClick={() => removeLine(l.id)} className="text-red-400 hover:text-red-500"><X size={16}/></button></div></div>))}</div>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Pay From</label><select className="w-full p-2 border dark:border-slate-600 rounded-xl text-sm mb-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)}>{paymentAccounts.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}</select><button className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold">Confirm Purchase</button></div>
        </form>
      ) : (
        <div className="space-y-3 pb-20">{purchases.map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 shadow-sm transition-colors"><div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700 dark:text-slate-200">{p.vendor}</span><span className="text-sm font-bold text-red-500">-{formatMMK(p.total)}</span></div><p className="text-xs text-slate-400 dark:text-slate-500">{p.date} • {p.items?.length} Items</p></div>))}</div>
      )}
    </div>
  );
};