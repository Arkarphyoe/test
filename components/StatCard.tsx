import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  icon: LucideIcon;
  isAlert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon: Icon, isAlert }) => (
  <div className={`${color} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]`}>
    <div className="relative z-10">
      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-xl font-bold truncate">{value}</h3>
    </div>
    <Icon className="absolute right-[-10px] bottom-[-10px] opacity-20 rotate-[-10deg]" size={70} />
    {isAlert && <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></div>}
  </div>
);