import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Wallet, BarChart3, ClipboardList, ArrowDownCircle, Database, Moon, Sun } from 'lucide-react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { auth, db, appId, isMock } from './services/firebase';
import { DEFAULT_COA, DEFAULT_PRICELISTS, DEFAULT_INVENTORY, DEFAULT_PARTNERS } from './constants';
import { NavBtn } from './components/NavBtn';
import { Dashboard } from './components/Dashboard';
import { SalesModule } from './components/SalesModule';
import { PurchaseModule } from './components/PurchaseModule';
import { InventoryModule } from './components/InventoryModule';
import { MasterData } from './components/MasterData';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { formatMMK } from './utils/format';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Data States
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [coa, setCoa] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [priceListItems, setPriceListItems] = useState<any[]>([]);
  const [stockMoves, setStockMoves] = useState<any[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    // If we are in mock mode (no config), verify as demo user immediately
    if (isMock) {
      console.log("Running in Demo Mode");
      setUser({ uid: 'demo-user', isAnonymous: true });
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth failed", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // In Demo Mode, load default data and skip Firestore listeners
    if (isMock) {
      setInventory(DEFAULT_INVENTORY.map((i, idx) => ({ ...i, id: `demo-${idx}` })));
      setSales([]);
      setPurchases([]);
      setExpenses([]);
      setPartners(DEFAULT_PARTNERS.map((p, i) => ({ ...p, id: `demo-partner-${i}` })));
      setCoa(DEFAULT_COA.map((c, i) => ({ ...c, id: `def-${i}` })));
      setPriceLists(DEFAULT_PRICELISTS.map((p, i) => ({ ...p, id: `def-${i}` })));
      setPriceListItems([]);
      setStockMoves([]);
      setLoading(false);
      return;
    }

    const getUserCollection = (colName: string) => collection(db, 'artifacts', appId, 'users', user.uid, colName);

    const unsubInventory = onSnapshot(getUserCollection('inventory'), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventory(data.length > 0 ? data : DEFAULT_INVENTORY.map((i, idx) => ({ ...i, id: `demo-${idx}` })));
    });
    const unsubSales = onSnapshot(getUserCollection('sales'), s => setSales(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds)));
    const unsubPurchases = onSnapshot(getUserCollection('purchase_orders'), s => setPurchases(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds)));
    const unsubExpenses = onSnapshot(getUserCollection('expenses'), s => {
      setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds));
      setLoading(false);
    });
    const unsubPartners = onSnapshot(getUserCollection('partners'), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setPartners(data.length > 0 ? data : DEFAULT_PARTNERS.map((p, i) => ({ ...p, id: `demo-partner-${i}` })));
    });
    const unsubCoa = onSnapshot(getUserCollection('chart_of_accounts'), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoa(data.length > 0 ? data : DEFAULT_COA.map((c, i) => ({ ...c, id: `def-${i}` })));
    });
    const unsubPriceLists = onSnapshot(getUserCollection('price_lists'), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setPriceLists(data.length > 0 ? data : DEFAULT_PRICELISTS.map((p, i) => ({ ...p, id: `def-${i}` })));
    });
    const unsubPriceListItems = onSnapshot(getUserCollection('price_list_items'), s => {
      setPriceListItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAudit = onSnapshot(query(getUserCollection('stock_moves'), orderBy('timestamp', 'desc'), limit(100)), s => {
      setStockMoves(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubInventory(); unsubSales(); unsubPurchases(); unsubExpenses(); unsubPartners(); unsubCoa(); unsubPriceLists(); unsubPriceListItems(); unsubAudit();
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const lowStockCount = inventory.filter(i => (i.stock || 0) < 5 && i.type !== 'Service').length;
    const inventoryValue = inventory.reduce((acc, curr) => acc + ((curr.cost || 0) * (curr.stock || 0)), 0);
    return { totalSales, totalExpenses, lowStockCount, inventoryValue, netProfit: totalSales - totalExpenses };
  }, [sales, expenses, inventory]);

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-900">Loading ERP...</div>;
  if (!user) return <div className="p-4 text-center dark:text-slate-200">Please refresh.</div>;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-800 dark:text-slate-100 pb-24 w-full md:max-w-lg md:mx-auto md:shadow-2xl md:border-x border-slate-200 dark:border-slate-800 relative flex flex-col transition-colors">
      <header className={`px-5 py-4 sticky top-0 z-20 shadow-md ${isMock ? 'bg-amber-600' : 'bg-blue-600'} text-white transition-colors`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">PocketERP {isMock && <span className="text-xs bg-black/20 px-2 py-0.5 rounded">DEMO</span>}</h1>
            <p className="text-blue-100 text-xs opacity-80">ID: {user.uid.slice(0, 6)}...</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="h-9 w-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center font-bold text-xs border border-white/30">OA</div>
          </div>
        </div>
      </header>

      <main className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'dashboard' && <Dashboard stats={stats} recentSales={sales.slice(0, 5)} formatMMK={formatMMK} />}
        {activeTab === 'sales' && <SalesModule inventory={inventory} userId={user.uid} sales={sales} partners={partners} priceLists={priceLists} priceListItems={priceListItems} formatMMK={formatMMK} coa={coa} />}
        {activeTab === 'purchase' && <PurchaseModule inventory={inventory} userId={user.uid} purchases={purchases} partners={partners} coa={coa} formatMMK={formatMMK} />}
        {activeTab === 'inventory' && <InventoryModule inventory={inventory} userId={user.uid} stockMoves={stockMoves} formatMMK={formatMMK} />}
        {activeTab === 'master' && <MasterData inventory={inventory} partners={partners} coa={coa} priceLists={priceLists} priceListItems={priceListItems} userId={user.uid} formatMMK={formatMMK} />}
        {activeTab === 'expenses' && <Expenses expenses={expenses} userId={user.uid} coa={coa} formatMMK={formatMMK} />}
        {activeTab === 'reports' && <Reports sales={sales} expenses={expenses} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 pb-safe z-30 w-full md:max-w-lg md:mx-auto shadow-[0_-5px_15px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar transition-colors">
        <div className="flex justify-between px-4 min-w-[350px]">
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Home" active={activeTab} set={setActiveTab} />
          <NavBtn id="sales" icon={ShoppingCart} label="Sales" active={activeTab} set={setActiveTab} />
          <NavBtn id="purchase" icon={ArrowDownCircle} label="Buy" active={activeTab} set={setActiveTab} />
          <NavBtn id="inventory" icon={ClipboardList} label="Stock" active={activeTab} set={setActiveTab} />
          <NavBtn id="master" icon={Database} label="Master" active={activeTab} set={setActiveTab} />
          <NavBtn id="expenses" icon={Wallet} label="Expenses" active={activeTab} set={setActiveTab} />
          <NavBtn id="reports" icon={BarChart3} label="Stats" active={activeTab} set={setActiveTab} />
        </div>
      </nav>
    </div>
  );
}