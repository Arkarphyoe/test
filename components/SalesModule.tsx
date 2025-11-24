import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, ListChecks, CheckCircle2, User, X } from 'lucide-react';
import { InventoryItem, Sale, Partner, PriceList, PriceListItem, ChartOfAccount } from '../types';
import { db, appId, createStockMove } from '../services/firebase';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface SalesModuleProps {
  inventory: InventoryItem[];
  userId: string;
  sales: Sale[];
  partners: Partner[];
  priceLists: PriceList[];
  priceListItems: PriceListItem[];
  formatMMK: (val: number | string) => string;
  coa: ChartOfAccount[];
}

export const SalesModule: React.FC<SalesModuleProps> = ({ inventory, userId, sales, partners, priceLists, priceListItems, formatMMK, coa }) => {
  const [view, setView] = useState('pos');
  const [customerName, setCustomerName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [priceListId, setPriceListId] = useState(priceLists[0]?.id || 'def-0');
  const [discount, setDiscount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [multiSelection, setMultiSelection] = useState<string[]>([]);

  // Payment Method State
  const paymentAccounts = coa.filter(c => c.type === 'payment');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('');

  // Set default payment account when available
  useEffect(() => {
    if (paymentAccounts.length > 0 && !selectedPaymentAccount) {
      setSelectedPaymentAccount(paymentAccounts[0].code);
    }
  }, [paymentAccounts, selectedPaymentAccount]);

  const getCalculatedPrice = (product: InventoryItem, listId: string) => {
    const fixedItem = priceListItems.find(p => p.priceListId === listId && p.productId === product.id);
    if (fixedItem) return parseFloat(fixedItem.price as any);
    const list = priceLists.find(p => p.id === listId);
    return product.price * (list ? parseFloat(list.multiplier as any) : 1.0);
  };

  const addToOrder = (item: InventoryItem) => {
    const existing = orderLines.find(line => line.id === item.id);
    const finalPrice = getCalculatedPrice(item, priceListId);
    if (existing) setOrderLines(prev => prev.map(line => line.id === item.id ? { ...line, qty: line.qty + 1 } : line));
    else setOrderLines(prev => [...prev, { ...item, qty: 1, price: finalPrice, originalPrice: item.price }]);
    setItemSearch('');
  };

  const updateLineQty = (id: string, newQty: number) => {
    if (newQty < 1) {
      setOrderLines(prev => prev.filter(line => line.id !== id));
    } else {
      setOrderLines(prev => prev.map(line => line.id === id ? { ...line, qty: newQty } : line));
    }
  };

  const toggleSelection = (id: string) => {
    setMultiSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const addMultiSelection = () => {
    setOrderLines(prev => {
      const newLines = [...prev];
      multiSelection.forEach(id => {
        const item = inventory.find(i => i.id === id);
        if (item) {
          const existing = newLines.find(l => l.id === id);
          const finalPrice = getCalculatedPrice(item, priceListId);
          if (existing) existing.qty += 1;
          else newLines.push({ ...item, qty: 1, price: finalPrice, originalPrice: item.price });
        }
      });
      return newLines;
    });
    setMultiSelection([]);
    setIsMultiSelectOpen(false);
  };

  const createSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault(); if (orderLines.length === 0) return alert("Order empty");
    const subtotal = orderLines.reduce((acc, l) => acc + (l.price * l.qty), 0);
    const total = Math.max(0, subtotal - (parseFloat(discount) || 0));
    
    // Include selected payment account if cash
    const paymentAccount = paymentType === 'cash' ? selectedPaymentAccount : null;

    const orderRef = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'sales'), {
      customer: { name: customerName }, 
      date: orderDate, 
      priceList: priceListId, 
      paymentType, 
      paymentAccount,
      discount: parseFloat(discount) || 0, 
      items: orderLines, 
      subtotal, 
      total, 
      timestamp: serverTimestamp()
    });

    for (const line of orderLines) {
      if (!line.id.startsWith('demo-')) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'inventory', line.id), { stock: line.stock - line.qty });
        await createStockMove(userId, {
          productId: line.id, productName: line.name, qty: line.qty,
          from: 'WH/Stock', to: 'Partner Locations/Customers', ref: `Sale ${orderRef.id.slice(0,4)}`
        });
      }
    }
    setOrderLines([]); setCustomerName(''); setDiscount(''); alert("Order Created!");
  };

  const filteredItems = inventory.filter(i => i.stock > 0 && i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredPartners = partners.filter(p => p.type === 'Customer' && p.name.toLowerCase().includes(partnerSearch.toLowerCase()));

  const renderPOS = () => (
    <form onSubmit={createSalesOrder} className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-colors">
      {isMultiSelectOpen && (
        <div className="absolute inset-0 bg-white dark:bg-slate-800 z-50 flex flex-col animate-in slide-in-from-bottom-10">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2"><ListChecks size={18} className="text-blue-600"/> Select Products</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsMultiSelectOpen(false)} className="text-slate-500 dark:text-slate-400 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button 
                type="button" 
                onClick={addMultiSelection} 
                disabled={multiSelection.length === 0}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 shadow-sm active:scale-95 transition-all"
              >
                Add ({multiSelection.length})
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {inventory.filter(i => i.stock > 0).map(item => {
              const isSelected = multiSelection.includes(item.id);
              const price = getCalculatedPrice(item, priceListId);
              return (
                <button 
                  key={item.id} 
                  type="button"
                  onClick={() => toggleSelection(item.id)}
                  className={`w-full flex justify-between items-center p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.stock} in stock • <span className="font-medium text-slate-600 dark:text-slate-400">{formatMMK(price)}</span></p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center transition-colors">
        <h3 className="font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2"><ShoppingCart size={18}/> New Order</h3>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600 p-0.5"><button type="button" onClick={() => setPaymentType('cash')} className={`px-3 py-1 text-xs font-bold rounded ${paymentType === 'cash' ? 'bg-emerald-500 text-white' : 'text-slate-400 dark:text-slate-500'}`}>Cash</button><button type="button" onClick={() => setPaymentType('credit')} className={`px-3 py-1 text-xs font-bold rounded ${paymentType === 'credit' ? 'bg-blue-500 text-white' : 'text-slate-400 dark:text-slate-500'}`}>Credit</button></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative group">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Customer</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-300 dark:text-slate-500" />
              <input 
                required 
                type="text" 
                className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                placeholder="Select or Type Name" 
                value={customerName} 
                onChange={e => {
                  setCustomerName(e.target.value); 
                  setPartnerSearch(e.target.value);
                  setShowPartnerDropdown(true);
                }}
                onFocus={() => setShowPartnerDropdown(true)}
                onBlur={() => setTimeout(() => setShowPartnerDropdown(false), 200)}
              />
              {showPartnerDropdown && filteredPartners.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg rounded-xl mt-1 z-20 max-h-32 overflow-y-auto">
                  {filteredPartners.map(p => (
                    <button 
                      key={p.id} 
                      type="button" 
                      className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b border-slate-50 dark:border-slate-700 last:border-0 text-slate-700 dark:text-slate-200" 
                      onClick={() => {
                        setCustomerName(p.name); 
                        setPartnerSearch(p.name);
                        setShowPartnerDropdown(false);
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Date</label><input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Price List</label>
            <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100" value={priceListId} onChange={e => {
                const newListId = e.target.value; setPriceListId(newListId);
                setOrderLines(prev => prev.map(line => {
                  const originalItem = inventory.find(i => i.id === line.id);
                  return originalItem ? { ...line, price: getCalculatedPrice(originalItem, newListId) } : line;
                }));
              }}
            >
              {priceLists.map(p => <option key={p.id} value={p.id}>{p.name || p.label}</option>)}
            </select>
          </div>
          
          {/* Payment Method Selector for Cash Sales */}
          {paymentType === 'cash' && (
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Payment Method</label>
              <select 
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedPaymentAccount}
                onChange={(e) => setSelectedPaymentAccount(e.target.value)}
              >
                {paymentAccounts.map(a => <option key={a.id} value={a.code}>{a.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center relative z-10">
           <div className="relative flex-1">
             <Search size={18} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"/>
             <input type="text" className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" placeholder="Add Product..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
             {itemSearch && (
               <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg rounded-xl mt-1 z-10 max-h-48 overflow-y-auto">
                 {filteredItems.map(item => (
                   <button key={item.id} type="button" onClick={() => addToOrder(item)} className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                     <span>{item.name}</span><span className="text-blue-600 dark:text-blue-400 font-bold">{formatMMK(getCalculatedPrice(item, priceListId))}</span>
                   </button>
                 ))}
               </div>
             )}
           </div>
           <button 
             type="button"
             onClick={() => setIsMultiSelectOpen(true)} 
             className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
             title="Multi-Select Products"
           >
             <ListChecks size={20} />
           </button>
        </div>

        <div className="space-y-2">
           {orderLines.map(line => (
             <div key={line.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-700">
               <div className="flex-1">
                 <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{line.name}</p>
                 <p className="text-xs text-slate-400 dark:text-slate-500">{formatMMK(line.price)}/unit</p>
               </div>
               <div className="flex items-center gap-3">
                 <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 h-8">
                   <button type="button" onClick={() => updateLineQty(line.id, line.qty - 1)} className="px-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">-</button>
                   <input 
                     type="number" 
                     className="w-10 text-center text-sm font-bold outline-none appearance-none bg-transparent text-slate-800 dark:text-slate-100" 
                     value={line.qty} 
                     onChange={(e) => updateLineQty(line.id, parseInt(e.target.value) || 0)}
                   />
                   <button type="button" onClick={() => updateLineQty(line.id, line.qty + 1)} className="px-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">+</button>
                 </div>
                 <span className="font-bold text-sm w-16 text-right text-slate-800 dark:text-slate-200">{formatMMK(line.price * line.qty)}</span>
                 <button type="button" onClick={() => setOrderLines(prev => prev.filter(l => l.id !== line.id))} className="text-slate-300 dark:text-slate-600 hover:text-red-500"><X size={16}/></button>
               </div>
             </div>
           ))}
        </div>
      </div>
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 transition-colors">
         <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500 dark:text-slate-400">Discount</span><input type="number" className="w-20 p-1 text-right text-xs border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
         <div className="flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-slate-200">Total</span><span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatMMK(Math.max(0, orderLines.reduce((a,l) => a+(l.price*l.qty),0) - (parseFloat(discount)||0)))}</span></div>
         <button type="submit" className="w-full mt-3 bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold">Confirm</button>
      </div>
    </form>
  );

  return (
    <div className="h-full flex flex-col">
       <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 transition-colors">
         <button onClick={() => setView('pos')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${view === 'pos' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>New Order</button>
         <button onClick={() => setView('history')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${view === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>History</button>
       </div>
       {view === 'pos' ? renderPOS() : (
         <div className="space-y-3 pb-20">{sales.map(s => (
           <div key={s.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex justify-between"><span className="font-bold text-slate-800 dark:text-slate-200">#{s.id.slice(0,4)} • {s.customer?.name}</span><span className="font-bold text-blue-600 dark:text-blue-400">{formatMMK(s.total)}</span></div>
              {s.paymentType === 'cash' && s.paymentAccount && (
                 <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Paid to: {coa.find(c => c.code === s.paymentAccount)?.label || s.paymentAccount}</p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.timestamp?.seconds*1000).toLocaleString()}</p>
           </div>
         ))}</div>
       )}
    </div>
  );
};