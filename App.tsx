// FILE: App.tsx (Safe Mode)

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SubjectEntryForm from './components/SubjectEntryForm';
import StudentForm from './components/StudentForm';

// 🛑 ABHI KE LIYE INKO BAND KAR RAHE HAIN (Taaki Error na aaye)
// import LoginScreen from './components/LoginScreen';
// import SchoolSetup from './components/SchoolSetup';
// import StaffManagement from './components/StaffManagement';
// import AttendanceManager from './components/AttendanceManager';
// import HomeworkTracker from './components/HomeworkTracker';
// import ResultTable from './components/ResultTable';

// Simple User Type
interface User {
  username: string;
  role: string;
  name: string;
  assignedClass?: string;
  [key: string]: any;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load User
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    } else {
      // Auto-Login as Admin for Testing (Kyunki LoginScreen band hai)
      setUser({ name: 'Amarjeet Singh', role: 'ADMIN', username: 'admin' });
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    window.location.reload(); // Reload to reset
  };

  if (!user) return <div className="p-10 text-center">Loading System...</div>;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={isSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm p-4 flex items-center md:hidden">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600">☰</button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
          
          {/* ✅ SIRF WORKING COMPONENTS CHALENGE */}
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'entry' && <SubjectEntryForm currentUser={user} />}
          {activeTab === 'enrollment' && <StudentForm onBack={() => setActiveTab('dashboard')} />}

          {/* 🚧 Maintenance Message for others */}
          {['staff', 'attendance', 'homework', 'result_sheet'].includes(activeTab) && (
            <div className="p-10 text-center bg-white rounded-xl shadow border-l-4 border-yellow-500">
              <h2 className="text-2xl font-bold text-gray-800">🚧 Under Maintenance</h2>
              <p className="text-gray-600 mt-2">
                This feature ({activeTab.toUpperCase()}) is being updated. Please check back in 5 minutes.
              </p>
            </div>
          )}
           
        </main>
      </div>
    </div>
  );
}

export default App;
