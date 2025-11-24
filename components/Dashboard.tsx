import React from 'react';
import { TrendingUp, Wallet, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { StatCard } from './StatCard';
import { Stats, Sale } from '../types';

interface DashboardProps {
  stats: Stats;
  recentSales: Sale[];
  formatMMK: (val: number | string) => string;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, recentSales, formatMMK }) => (
  <div className="space-y-5 animate-in fade-in">
    <div className="grid grid-cols-2 gap-4">
      <StatCard title="Sales" value={formatMMK(stats.totalSales)} color="bg-gradient-to-br from-emerald-500 to-emerald-600" icon={TrendingUp} />
      <StatCard title="Profit" value={formatMMK(stats.netProfit)} color="bg-gradient-to-br from-blue-500 to-blue-600" icon={Wallet} />
      <StatCard title="Low Stock" value={stats.lowStockCount} color="bg-gradient-to-br from-amber-500 to-amber-600" icon={AlertTriangle} isAlert={stats.lowStockCount > 0} />
      <StatCard title="Inventory Cost" value={formatMMK(stats.inventoryValue)} color="bg-gradient-to-br from-slate-500 to-slate-600" icon={Package} />
    </div>
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
        <ShoppingCart size={18} className="mr-2 text-blue-500" /> Recent Activity
      </h3>
      {recentSales.length === 0 ? (
        <p className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">No activity yet.</p>
      ) : (
        <div className="space-y-4">
          {recentSales.map(s => (
            <div key={s.id} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-700 pb-2">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Order #{s.id.slice(0, 4)}</span><br />
                <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.timestamp?.seconds * 1000).toLocaleTimeString()}</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatMMK(s.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);