import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavBtnProps {
  id: string;
  icon: LucideIcon;
  label: string;
  active: string;
  set: (id: string) => void;
}

export const NavBtn: React.FC<NavBtnProps> = ({ id, icon: Icon, label, active, set }) => (
  <button 
    onClick={() => set(id)} 
    className={`flex flex-col items-center justify-center min-w-[50px] py-1 transition-colors ${active === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    <Icon size={22} strokeWidth={active === id ? 2.5 : 2} className={active === id ? 'scale-110 transition-transform' : ''} />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);