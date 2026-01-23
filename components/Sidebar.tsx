// FILE: components/Sidebar.tsx
import React from 'react';

// 🛑 Local Types Only
interface SidebarProps {
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, isOpen, onLogout }) => {
  const safeUser = user || { name: 'User', role: 'Teacher' };
  
  // Menu Items Config
  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', roles: ['ADMIN', 'CLASS_INCHARGE', 'SUBJECT_TEACHER'] },
    { id: 'attendance', label: '📅 Attendance', roles: ['CLASS_INCHARGE', 'ADMIN'] },
    { id: 'entry', label: '📝 Marks Entry', roles: ['SUBJECT_TEACHER', 'CLASS_INCHARGE', 'ADMIN'] },
    { id: 'result_sheet', label: '📜 Result Sheet', roles: ['CLASS_INCHARGE', 'ADMIN'] }, // New Result Feature
    { id: 'enrollment', label: '🎓 New Admission', roles: ['ADMIN', 'CLASS_INCHARGE'] },
    { id: 'homework', label: '🏠 Homework', roles: ['SUBJECT_TEACHER', 'CLASS_INCHARGE'] },
    { id: 'staff', label: '👥 Staff Room', roles: ['ADMIN'] },
  ];

  // Filter based on Role
  const visibleItems = menuItems.filter(item => 
    item.roles.includes(safeUser.role) || safeUser.role === 'ADMIN'
  );

  return (
    <div className={`bg-gray-900 text-white h-screen transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold truncate">{safeUser.name}</h2>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 uppercase tracking-wide">
          {safeUser.role.replace('_', ' ')}
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left px-6 py-3 transition-colors flex items-center gap-3
              ${activeTab === item.id ? 'bg-indigo-600 text-white border-r-4 border-indigo-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-bold text-sm transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
