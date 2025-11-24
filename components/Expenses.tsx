import React, { useState, useEffect } from 'react';
import { Expense, ChartOfAccount } from '../types';
import { db, appId } from '../services/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ExpensesProps {
  expenses: Expense[];
  userId: string;
  coa: ChartOfAccount[];
  formatMMK: (val: number | string) => string;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, userId, coa, formatMMK }) => {
  const [expenseLines, setExpenseLines] = useState([{ id: 1, description: '', amount: '', accountCode: '' }]);
  const [paymentLines, setPaymentLines] = useState([{ id: 1, accountId: '', amount: '' }]);
  const [isAdding, setIsAdding] = useState(false);
  const expenseAccounts = coa.filter(c => c.type === 'expense');
  const paymentAccounts = coa.filter(c => c.type === 'payment');

  useEffect(() => {
    if (isAdding) {
       setExpenseLines([{ id: Date.now(), description: '', amount: '', accountCode: expenseAccounts[0]?.code || '' }]);
       setPaymentLines([{ id: Date.now()+1, accountId: paymentAccounts[0]?.code || '', amount: '' }]);
    }
  }, [isAdding]);

  const totalExpense = expenseLines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);
  const totalPaid = paymentLines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);
  const isBalanced = Math.abs(totalExpense - totalPaid) < 0.01 && totalExpense > 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'expenses'), {
        amount: totalExpense, items: expenseLines, paymentMethods: paymentLines, timestamp: serverTimestamp(),
        description: expenseLines.length > 1 ? `Split Expense (${expenseLines.length})` : expenseLines[0].description
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Expenses</h2><button onClick={() => setIsAdding(!isAdding)} className="text-blue-600 dark:text-blue-400 font-bold text-sm">+ Add</button></div>
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-4 transition-colors">
           <div>
             <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Items</label>
             {expenseLines.map((l, i) => (
               <div key={l.id} className="flex gap-2 mt-2">
                 <input className="flex-1 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="Desc" value={l.description} onChange={e => {const n=[...expenseLines]; n[i].description=e.target.value; setExpenseLines(n)}} />
                 <select className="w-1/3 p-2 border dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={l.accountCode} onChange={e => {const n=[...expenseLines]; n[i].accountCode=e.target.value; setExpenseLines(n)}}>{expenseAccounts.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}</select>
                 <input type="number" className="w-20 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="0.00" value={l.amount} onChange={e => {const n=[...expenseLines]; n[i].amount=e.target.value; setExpenseLines(n)}} />
               </div>
             ))}
             <button type="button" onClick={() => setExpenseLines([...expenseLines, {id: Date.now(), description:'', amount:'', accountCode: expenseAccounts[0]?.code}])} className="text-xs text-blue-500 dark:text-blue-400 mt-1">+ Split Item</button>
           </div>
           <div>
             <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Paid Via</label>
             {paymentLines.map((l, i) => (
               <div key={l.id} className="flex gap-2 mt-2">
                 <select className="flex-1 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" value={l.accountId} onChange={e => {const n=[...paymentLines]; n[i].accountId=e.target.value; setPaymentLines(n)}}>{paymentAccounts.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}</select>
                 <input type="number" className="w-24 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" placeholder="0.00" value={l.amount} onChange={e => {const n=[...paymentLines]; n[i].amount=e.target.value; setPaymentLines(n)}} />
               </div>
             ))}
             <button type="button" onClick={() => setPaymentLines([...paymentLines, {id: Date.now(), accountId: paymentAccounts[0]?.code, amount:''}])} className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">+ Split Payment</button>
           </div>
           <div className={`p-3 rounded-xl flex justify-between items-center ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
             <span className="text-xs font-bold">{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
             <button disabled={!isBalanced} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50">Save</button>
           </div>
        </form>
      )}
      <div className="space-y-3 pb-20">{expenses.map(e => <div key={e.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between transition-colors"><span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{e.description}</span><span className="font-bold text-red-500 dark:text-red-400">-{formatMMK(e.amount)}</span></div>)}</div>
    </div>
  );
};