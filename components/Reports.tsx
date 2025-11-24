import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import { Sale, Expense } from '../types';

interface ReportsProps {
  sales: Sale[];
  expenses: Expense[];
}

export const Reports: React.FC<ReportsProps> = ({ sales, expenses }) => {
  const totalIncome = sales.reduce((a, b) => a + b.total, 0);
  const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h3 className="font-bold text-slate-700 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Wallet className="text-blue-500" size={20} /> Overview
        </h3>
        <div className="h-56 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'In', value: totalIncome }, { name: 'Out', value: totalExpense }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" />
              <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
              <Tooltip 
                cursor={{ fill: '#f8fafc', opacity: 0.1 }} 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};