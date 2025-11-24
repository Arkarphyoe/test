import React, { useState, useEffect } from 'react';
import { Package, Users, List, Tags, Search, Plus, Save, Box, Pencil, Trash2, Tag, X } from 'lucide-react';
import { InventoryItem, Partner, ChartOfAccount, PriceList, PriceListItem } from '../types';
import { db, appId, logAudit } from '../services/firebase';
import { addDoc, collection, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface MasterDataProps {
  inventory: InventoryItem[];
  partners: Partner[];
  coa: ChartOfAccount[];
  priceLists: PriceList[];
  priceListItems: PriceListItem[];
  userId: string;
  formatMMK: (val: number | string) => string;
}

const MasterTabBtn = ({ id, label, icon: Icon, active, set }: any) => (
  <button onClick={() => set(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${active === id ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}><Icon size={16} /> {label}</button>
);

export const MasterData: React.FC<MasterDataProps> = ({ inventory, partners, coa, priceLists, priceListItems, userId, formatMMK }) => {
  const [subTab, setSubTab] = useState('products'); 
  const renderSubTab = () => {
    switch(subTab) {
      case 'partners': return <PartnerMaster partners={partners} userId={userId} />;
      case 'coa': return <COAMaster coa={coa} userId={userId} />;
      case 'pricelist': return <PriceListMaster priceLists={priceLists} priceListItems={priceListItems} inventory={inventory} userId={userId} formatMMK={formatMMK} />;
      default: return <ProductMaster inventory={inventory} userId={userId} formatMMK={formatMMK} />;
    }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <MasterTabBtn id="products" label="Products" icon={Package} active={subTab} set={setSubTab} />
        <MasterTabBtn id="partners" label="Partners" icon={Users} active={subTab} set={setSubTab} />
        <MasterTabBtn id="coa" label="COA" icon={List} active={subTab} set={setSubTab} />
        <MasterTabBtn id="pricelist" label="Prices" icon={Tags} active={subTab} set={setSubTab} />
      </div>
      <div className="flex-1 overflow-hidden">{renderSubTab()}</div>
    </div>
  );
};

const ProductMaster = ({ inventory, userId, formatMMK }: any) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'Storable', category: '', cost: '', price: '', stock: '' });

  const startEdit = (item: any) => {
    if (item.id.startsWith('demo-')) return alert("Cannot edit demo data.");
    setEditingId(item.id);
    setFormData({ name: item.name, type: item.type || 'Storable', category: item.category || '', cost: item.cost || '', price: item.price, stock: item.stock || 0 });
    setIsFormOpen(true);
  };
  const cancelEdit = () => { setEditingId(null); setFormData({ name: '', type: 'Storable', category: '', cost: '', price: '', stock: '' }); setIsFormOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Name and Selling Price are required.");
    if (!window.confirm(`Confirm ${editingId ? 'update' : 'save'}?`)) return;
    const payload = { ...formData, cost: parseFloat(formData.cost) || 0, price: parseFloat(formData.price), stock: formData.type === 'Service' ? 0 : (parseInt(String(formData.stock)) || 0), updatedAt: serverTimestamp() };
    if (editingId) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'inventory', editingId), payload); await logAudit(userId, 'UPDATE', 'Product', { id: editingId, ...payload }); } 
    else { const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'inventory'), { ...payload, createdAt: serverTimestamp() }); await logAudit(userId, 'CREATE', 'Product', { id: ref.id, ...payload }); }
    cancelEdit();
  };
  const handleDelete = async (id: string) => { if (id.startsWith('demo-')) return alert("Cannot delete demo data."); if(window.confirm("Delete product?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'inventory', id)); await logAudit(userId, 'DELETE', 'Product', { id }); } };
  const filtered = inventory.filter((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500"/><input type="text" placeholder="Search products..." className="w-full pl-10 p-2.5 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <button onClick={() => { setIsFormOpen(!isFormOpen); if(!isFormOpen) cancelEdit(); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md font-bold text-sm flex items-center gap-2"><Plus size={18}/> New Product</button>
      </div>
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
           <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2"><h3 className="font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2"><Box size={18}/> {editingId ? 'Edit Product' : 'New Product'}</h3><button type="button" onClick={cancelEdit}><X size={18} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"/></button></div>
           <div className="space-y-3">
             <div><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Product Name</label><input className="w-full p-2.5 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="e.g. Dell XPS 15" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
             <div className="flex gap-3">
               <div className="flex-1"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Type</label><select className="w-full p-2.5 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="Storable">Storable Product</option><option value="Service">Service</option><option value="Consumable">Consumable</option></select></div>
               <div className="flex-1"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Category</label><input className="w-full p-2.5 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="e.g. Laptop" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
             </div>
             <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
               <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Cost (Ks)</label><input type="number" className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} /></div>
               <div><label className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 block">Selling Price (Ks)</label><input type="number" className="w-full p-2 border border-blue-200 dark:border-slate-600 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
             </div>
             {formData.type !== 'Service' && (
               <div><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Quantity On Hand</label><div className="flex items-center gap-3"><input type="number" className="w-1/3 p-2.5 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} /><span className="text-xs text-slate-400 dark:text-slate-500">Available for sale: <b>{formData.stock || 0}</b></span></div></div>
             )}
           </div>
           <div className="flex justify-between items-center pt-2"><span className="text-xs text-slate-400 dark:text-slate-500">Est. Margin: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formData.price && formData.cost ? `${(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%` : '0%'}</span></span><button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"><Save size={18} /> Save Product</button></div>
        </form>
      )}
      <div className="space-y-2 overflow-y-auto pb-20">
        {filtered.map((item: any) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
             <div><div className="flex items-center gap-2"><h4 className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</h4><span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded uppercase font-bold">{item.type || 'Storable'}</span></div><p className="text-xs text-slate-500 dark:text-slate-400">{item.type === 'Service' ? 'Service Item' : `${item.stock} on hand`} • {item.category || 'No Category'}</p></div>
             <div className="flex items-center gap-2"><div className="text-right mr-2"><span className="block font-bold text-blue-600 dark:text-blue-400 text-sm">{formatMMK(item.price)}</span>{item.cost > 0 && <span className="block text-[10px] text-slate-400 dark:text-slate-500">Cost: {formatMMK(item.cost)}</span>}</div>{!item.id.startsWith('demo-') && (<div className="flex gap-2"><button onClick={() => startEdit(item)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><Pencil size={16}/></button><button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></div>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PartnerMaster = ({ partners, userId }: any) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Customer' });

  const startEdit = (p: any) => { setEditingId(p.id); setFormData({ name: p.name, phone: p.phone, type: p.type }); setIsFormOpen(true); };
  const cancelEdit = () => { setEditingId(null); setFormData({ name: '', phone: '', type: 'Customer' }); setIsFormOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required.");
    if (!window.confirm(`Confirm ${editingId ? 'update' : 'save'}?`)) return;
    if (editingId) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'partners', editingId), formData); await logAudit(userId, 'UPDATE', 'Partner', { id: editingId, ...formData }); } 
    else { const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'partners'), formData); await logAudit(userId, 'CREATE', 'Partner', { id: ref.id, ...formData }); }
    cancelEdit();
  };
  const handleDelete = async (id: string) => { if (id.startsWith('demo-')) return alert("Cannot delete demo data."); if(window.confirm("Delete partner?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'partners', id)); await logAudit(userId, 'DELETE', 'Partner', { id }); } };
  const filtered = partners.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500"/><input type="text" placeholder="Search partners..." className="w-full pl-10 p-2.5 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><button onClick={() => {setIsFormOpen(!isFormOpen); if(!isFormOpen) cancelEdit();}} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md"><Plus size={20}/></button></div>
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
           <h3 className="font-bold text-slate-700 dark:text-slate-100">{editingId ? 'Edit Partner' : 'New Partner'}</h3>
           <input className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           <div className="flex gap-2"><input className="flex-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Phone/Email" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /><select className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option>Customer</option><option>Vendor</option></select></div>
           <div className="flex gap-2"><button type="button" onClick={cancelEdit} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg font-bold">Cancel</button><button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18}/> {editingId ? 'Update' : 'Save'}</button></div>
        </form>
      )}
      <div className="space-y-2 overflow-y-auto pb-20">
        {filtered.map((p: any) => (
          <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors"><div><h4 className="font-bold text-slate-700 dark:text-slate-200">{p.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400">{p.type} • {p.phone}</p></div>{!p.id.startsWith('demo-') && (<div className="flex gap-2"><button onClick={() => startEdit(p)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><Pencil size={16}/></button><button onClick={() => handleDelete(p.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></div>)}</div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500 py-10">No partners found.</p>}
      </div>
    </div>
  );
};

const COAMaster = ({ coa, userId }: any) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ code: '', label: '', type: 'expense' });

  const startEdit = (c: any) => { if (c.id.startsWith('def-')) return alert("Cannot edit defaults."); setEditingId(c.id); setFormData({ code: c.code, label: c.label, type: c.type }); setIsFormOpen(true); };
  const cancelEdit = () => { setEditingId(null); setFormData({ code: '', label: '', type: 'expense' }); setIsFormOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.label) return alert("Code and Label required.");
    if (!window.confirm(`Confirm ${editingId ? 'update' : 'save'}?`)) return;
    if (editingId) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'chart_of_accounts', editingId), formData); await logAudit(userId, 'UPDATE', 'COA', { id: editingId, ...formData }); }
    else { const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'chart_of_accounts'), formData); await logAudit(userId, 'CREATE', 'COA', { id: ref.id, ...formData }); }
    cancelEdit();
  };
  const handleDelete = async (id: string) => { if(window.confirm("Delete Account?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'chart_of_accounts', id)); await logAudit(userId, 'DELETE', 'COA', { id }); } };
  const filtered = coa.filter((c: any) => c.label.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.includes(searchTerm));

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500"/><input type="text" placeholder="Search COA..." className="w-full pl-10 p-2.5 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><button onClick={() => {setIsFormOpen(!isFormOpen); if(!isFormOpen) cancelEdit();}} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md"><Plus size={20}/></button></div>
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
           <h3 className="font-bold text-slate-700 dark:text-slate-100">{editingId ? 'Edit Account' : 'New Account'}</h3>
           <div className="flex gap-2"><input className="w-1/3 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /><input className="flex-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Label" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} /></div>
           <select className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="expense">Expense</option><option value="payment">Payment Method</option></select>
           <div className="flex gap-2"><button type="button" onClick={cancelEdit} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg font-bold">Cancel</button><button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18}/> {editingId ? 'Update' : 'Save'}</button></div>
        </form>
      )}
      <div className="space-y-2 overflow-y-auto pb-20">
        {filtered.map((c: any) => (
          <div key={c.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors"><div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${c.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>{c.type}</span><div><span className="font-mono font-bold text-slate-500 dark:text-slate-400 mr-2">{c.code}</span><span className="font-medium text-slate-700 dark:text-slate-200">{c.label}</span></div></div>{!c.id.startsWith('def-') && (<div className="flex gap-2"><button onClick={() => startEdit(c)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><Pencil size={16}/></button><button onClick={() => handleDelete(c.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></div>)}</div>
        ))}
      </div>
    </div>
  );
};

const PriceListMaster = ({ priceLists, priceListItems, inventory, userId, formatMMK }: any) => {
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listData, setListData] = useState({ name: '', multiplier: '1.0' });
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemData, setItemData] = useState({ priceListId: '', productId: '', price: '' });

  useEffect(() => {
    if (isItemFormOpen && !editingItemId && priceLists.length > 0 && inventory.length > 0) {
      setItemData(prev => ({ ...prev, priceListId: priceLists[0].id, productId: inventory[0].id }));
    }
  }, [isItemFormOpen, editingItemId, priceLists, inventory]);

  const startEditList = (l: any) => { if (l.id.startsWith('def-')) return alert("Cannot edit defaults."); setEditingListId(l.id); setListData({ name: l.name, multiplier: l.multiplier }); setIsListFormOpen(true); };
  const cancelEditList = () => { setEditingListId(null); setListData({ name: '', multiplier: '1.0' }); setIsListFormOpen(false); };
  
  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault(); if (!listData.name) return; if (!window.confirm("Save?")) return;
    const payload = { ...listData, multiplier: parseFloat(listData.multiplier) };
    if (editingListId) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'price_lists', editingListId), payload); await logAudit(userId, 'UPDATE', 'PriceList', { id: editingListId, ...payload }); }
    else { const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'price_lists'), payload); await logAudit(userId, 'CREATE', 'PriceList', { id: ref.id, ...payload }); }
    cancelEditList();
  };
  const handleDeleteList = async (id: string) => { if(window.confirm("Delete?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'price_lists', id)); await logAudit(userId, 'DELETE', 'PriceList', { id }); } };

  const startEditItem = (i: any) => { setEditingItemId(i.id); setItemData({ priceListId: i.priceListId, productId: i.productId, price: i.price }); setIsItemFormOpen(true); };
  const cancelEditItem = () => { setEditingItemId(null); setItemData({ priceListId: '', productId: '', price: '' }); setIsItemFormOpen(false); };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!itemData.price) return; if (!window.confirm("Save?")) return;
    if (editingItemId) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'price_list_items', editingItemId), itemData); await logAudit(userId, 'UPDATE', 'PriceItem', { id: editingItemId, ...itemData }); }
    else { const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'price_list_items'), itemData); await logAudit(userId, 'CREATE', 'PriceItem', { id: ref.id, ...itemData }); }
    cancelEditItem();
  };
  const handleDeleteItem = async (id: string) => { if(window.confirm("Delete?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'price_list_items', id)); await logAudit(userId, 'DELETE', 'PriceItem', { id }); } };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center"><h3 className="font-bold text-slate-700 dark:text-slate-100">Price Lists</h3><button onClick={() => {setIsListFormOpen(!isListFormOpen); if(!isListFormOpen) cancelEditList();}} className="text-blue-600 dark:text-blue-400 text-sm font-bold">{isListFormOpen ? 'Close' : '+ New List'}</button></div>
        {isListFormOpen && (
          <form onSubmit={handleSaveList} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
             <input className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Name" value={listData.name} onChange={e => setListData({...listData, name: e.target.value})} />
             <div className="flex items-center gap-2"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Multiplier:</label><input type="number" step="0.01" className="w-24 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={listData.multiplier} onChange={e => setListData({...listData, multiplier: e.target.value})} /></div>
             <div className="flex gap-2"><button type="button" onClick={cancelEditList} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg font-bold">Cancel</button><button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18}/> {editingListId ? 'Update' : 'Save'}</button></div>
          </form>
        )}
        <div className="space-y-2">
          {priceLists.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors"><div><h4 className="font-bold text-slate-700 dark:text-slate-200">{p.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400">x{p.multiplier}</p></div>{!p.id.startsWith('def-') && (<div className="flex gap-2"><button onClick={() => startEditList(p)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><Pencil size={16}/></button><button onClick={() => handleDeleteList(p.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></div>)}</div>
          ))}
        </div>
      </div>
      <div className="space-y-2 pb-20">
         <div className="flex justify-between items-center border-t pt-4 border-slate-200 dark:border-slate-700"><h3 className="font-bold text-slate-700 dark:text-slate-100">Exceptions</h3><button onClick={() => {setIsItemFormOpen(!isItemFormOpen); if(!isItemFormOpen) cancelEditItem();}} className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">{isItemFormOpen ? 'Close' : '+ New Item Price'}</button></div>
         {isItemFormOpen && (
          <form onSubmit={handleSaveItem} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
             <select className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={itemData.priceListId} onChange={e => setItemData({...itemData, priceListId: e.target.value})}>{priceLists.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
             <select className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={itemData.productId} onChange={e => setItemData({...itemData, productId: e.target.value})}>{inventory.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
             <input type="number" className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={itemData.price} onChange={e => setItemData({...itemData, price: e.target.value})} />
             <div className="flex gap-2"><button type="button" onClick={cancelEditItem} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg font-bold">Cancel</button><button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18}/> {editingItemId ? 'Update' : 'Save'}</button></div>
          </form>
         )}
         <div className="space-y-2">
           {priceListItems.map((item: any) => {
             const pl = priceLists.find((p: any) => p.id === item.priceListId); const prod = inventory.find((i: any) => i.id === item.productId);
             if (!pl || !prod) return null;
             return (
               <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors"><div><div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-1"><Tag size={10}/> {pl.name}</div><h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{prod.name}</h4></div><div className="flex items-center gap-3"><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMMK(item.price)}</span><div className="flex gap-2"><button onClick={() => startEditItem(item)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><Pencil size={16}/></button><button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></div></div></div>
             )
           })}
         </div>
      </div>
    </div>
  );
};