// FILE: components/Dashboard.tsx
import React from 'react';

// 🛑 Local Interface (Taaki koi Import Error na aaye)
interface DashboardProps {
  user: any; 
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Safe Fallback
  const safeUser = user || { name: 'User', role: 'GUEST' };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">
          Welcome, <span className="text-indigo-600">{safeUser.name}</span> 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Your Dashboard Panel ({safeUser.role})
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Students</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">450</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Present Today</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">412</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Pending Tasks</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">5</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📢 Quick Announcements</h2>
        <p className="text-gray-600">No new announcements for today.</p>
      </div>
    </div>
  );
};

export default Dashboard;
