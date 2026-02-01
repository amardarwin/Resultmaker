import React from 'react';
import { Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
    { id: 'homework', label: 'Homework', icon: 'fa-file-signature' },
    { id: 'sheet', label: 'Result Sheet', icon: 'fa-table-list' },
    { id: 'entry-portal', label: 'Entry Portal', icon: 'fa-pen-to-square', role: [Role.ADMIN, Role.CLASS_INCHARGE, Role.SUBJECT_TEACHER] },
    { id: 'staff', label: 'Staff Management', icon: 'fa-user-tie', role: [Role.ADMIN] },
  ];

  return (
    <div className="w-20 lg:w-72 bg-white border-r border-slate-100 h-screen sticky top-0 z-50 flex flex-col transition-all duration-300">
      <div className="h-20 flex items-center px-6 border-b border-slate-50 mb-6">
         <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 shrink-0">
           <i className="fa-solid fa-graduation-cap text-xl"></i>
         </div>
         <div className="ml-4 hidden lg:block overflow-hidden">
            <h1 className="text-xl font-black text-slate-800 truncate">EduRank Pro</h1>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Automation Engine</p>
         </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => {
          if (item.role && !item.role.includes(user?.role as Role)) return null;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <span className={`ml-4 hidden lg:block text-xs font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto hidden lg:block w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-50">
         <div className="bg-slate-50 p-4 rounded-2xl hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black uppercase shadow-sm">
               {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
               <p className="text-xs font-black text-slate-800 truncate">{user?.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user?.role.replace('_', ' ')}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;