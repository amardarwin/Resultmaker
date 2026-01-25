import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, ClassLevel, StudentMarks, ColumnMapping, Role, ExamType, CalculatedResult } from './types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS, getMarkKey } from './constants';
import { rankStudents } from './utils/calculations';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import ResultTable from './components/ResultTable';
import SubjectEntryForm from './components/SubjectEntryForm';
import StaffManagement from './components/StaffManagement';
import SchoolSetup from './components/SchoolSetup';
import LoginScreen from './components/LoginScreen';
import AttendanceManager from './components/AttendanceManager';
import HomeworkTracker from './components/HomeworkTracker';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, schoolConfig, logout, isViewRestricted, accessibleClasses } = useAuth();
  
  const [activeClass, setActiveClass] = useState<ClassLevel>('6');
  const [activeExamType, setActiveExamType] = useState<ExamType>(ExamType.FINAL);
  
  const [sortBySubject, setSortBySubject] = useState<keyof StudentMarks | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<{ subject: keyof StudentMarks | null, band: string | null }>({
    subject: null,
    band: null
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('school_results_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [view, setView] = useState<string>('dashboard');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user?.assignedClass && ALL_CLASSES.includes(user.assignedClass)) {
      setActiveClass(user.assignedClass);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    try {
      const effectiveSort = sortBySubject || undefined;
      let results = rankStudents(students, activeClass, activeExamType, effectiveSort as string);
      
      if (user?.role === Role.STUDENT && user.rollNo) {
        results = results.filter(r => r.rollNo === user.rollNo);
      }
      return results || [];
    } catch (e) {
      console.error("Ranking Calculation Error", e);
      return [];
    }
  }, [students, activeClass, activeExamType, sortBySubject, user]);

  if (!schoolConfig?.isSetup) return <SchoolSetup />;
  if (!user) return <LoginScreen />;

  const handleBulkUpdate = (updatedStudents: Student[]) => {
    setStudents(prev => {
      const otherClasses = prev.filter(s => s.classLevel !== activeClass);
      return [...otherClasses, ...updatedStudents];
    });
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            results={classResults} 
            allStudents={students} 
            className={activeClass} 
            onClassChange={setActiveClass}
            onNavigate={setView}
            examType={activeExamType}
            activeFilters={dashboardFilter}
            onSubjectClick={(s) => { setDashboardFilter({subject: s, band: null}); setView('sheet'); }}
            onBandClick={(b) => { setDashboardFilter({subject: null, band: b}); setView('sheet'); }}
            onClearFilters={() => setDashboardFilter({ subject: null, band: null })}
          />
        );
      case 'attendance':
        return <AttendanceManager classLevel={activeClass} students={students.filter(s => s.classLevel === activeClass)} />;
      case 'homework':
        return <HomeworkTracker classLevel={activeClass} />;
      case 'sheet':
        return (
          <ResultTable 
            results={classResults} 
            classLevel={activeClass} 
            onEdit={(s) => { setEditingStudent(s); setView('entry'); }} 
            onDelete={(id) => setStudents(prev => prev.filter(s => s.id !== id))} 
            highlightSubject={sortBySubject}
            activeFilters={dashboardFilter}
            onClearFilters={() => setDashboardFilter({ subject: null, band: null })}
            examType={activeExamType}
            onExamTypeChange={setActiveExamType}
          />
        );
      case 'entry':
        return (
          <StudentForm 
            onAdd={(s) => { 
              setStudents(prev => prev.some(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
              setView('sheet');
              setEditingStudent(null);
            }} 
            onCancel={() => { setView('sheet'); setEditingStudent(null); }} 
            editStudent={editingStudent || undefined} 
            examType={activeExamType}
          />
        );
      case 'entry-portal':
        return (
          <SubjectEntryForm 
            classLevel={activeClass} 
            onClassChange={setActiveClass}
            students={students.filter(s => s.classLevel === activeClass)} 
            onSave={handleBulkUpdate} 
            onCancel={() => setView('dashboard')} 
            examType={activeExamType}
            onExamTypeChange={setActiveExamType}
            currentUser={user}
          />
        );
      case 'staff':
        return <StaffManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Sidebar activeView={view} onViewChange={setView} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                {isViewRestricted ? (
                  <span className="px-6 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-lg uppercase tracking-widest">C-{activeClass}</span>
                ) : (
                  ALL_CLASSES.filter(c => accessibleClasses.includes(c)).map(cls => (
                    <button key={cls} onClick={() => setActiveClass(cls)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClass === cls ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>C-{cls}</button>
                  ))
                )}
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={logout} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 transition-all shadow-sm"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
           <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
