// FILE: App.tsx (Root)

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SubjectEntryForm from './components/SubjectEntryForm';
import StudentForm from './components/StudentForm';
import LoginScreen from './components/LoginScreen';
import SchoolSetup from './components/SchoolSetup';
import StaffManagement from './components/StaffManagement';
import AttendanceManager from './components/AttendanceManager';
import HomeworkTracker from './components/HomeworkTracker';
import ResultTable from './components/ResultTable'; // Import ResultTable

// Simple Types to prevent errors
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

  // Load User from LocalStorage on start
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User load error", e);
      }
    }
  }, []);

  // Login Handler
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  // Logout Handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard');
  };

  // Main Render Logic
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // School Setup Check (First Time)
  const isSchoolSetup = localStorage.getItem('school_setup_complete');
  if (!isSchoolSetup && user.role === 'ADMIN') {
    return <SchoolSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={isSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header for Mobile Menu Toggle */}
        <header className="bg-white shadow-sm p-4 flex items-center md:hidden">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600">
            ☰ Menu
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
          
          {/* CONTENT SWITCHER */}
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          
          {/* ✅ Fixed: Passing currentUser correctly */}
          {activeTab === 'entry' && <SubjectEntryForm currentUser={user} />}
          
          {/* ✅ Fixed: Handling Back Button */}
          {activeTab === 'enrollment' && <StudentForm onBack={() => setActiveTab('dashboard')} />}
          
          {activeTab === 'staff' && <StaffManagement />}
          
          {activeTab === 'attendance' && <AttendanceManager user={user} />}
          
          {activeTab === 'homework' && <HomeworkTracker user={user} />}

          {/* Result Sheet View */}
           {activeTab === 'result_sheet' && <ResultTable />}
           
        </main>
      </div>
    </div>
  );
}

export default App;
