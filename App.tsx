import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, ClassLevel, CalculatedResult, StudentMarks, ColumnMapping, Role, ExamType } from './types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from './constants';
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
import { getMarkKey } from './utils/examRules';

const AppContent: React.FC = () => {
  const { user, schoolConfig, logout, isViewRestricted, canEditStudent, accessibleClasses } = useAuth();
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

  // Import States
  const [csvPreview, setCsvPreview] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ rollNo: '', name: '', subjectMapping: {} });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.assignedClass) setActiveClass(user.assignedClass);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    const effectiveSort = sortBySubject || dashboardFilter.subject || undefined;
    let results = rankStudents(students, activeClass, activeExamType, effectiveSort as string);
    
    if (user?.role === Role.STUDENT && user.rollNo) {
      results = results.filter(r => r.rollNo === user.rollNo);
    }
    return results;
  }, [students, activeClass, activeExamType, sortBySubject, dashboardFilter.subject, user]);

  if (!schoolConfig?.isSetup) return <SchoolSetup />;
  if (!user) return <LoginScreen />;

  const handleAddOrUpdate = (student: Student) => {
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    } else {
      setStudents(prev => [...prev, student]);
    }
    setView('sheet');
    setEditingStudent(null);
  };

  const handleBulkUpdate = (updatedStudents: Student[]) => {
    setStudents(prev => {
      const otherClasses = prev.filter(s => s.classLevel !== activeClass);
      return [...otherClasses, ...updatedStudents];
    });
    setView('sheet');
  };

  const handleDelete = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setView('entry');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (json.length < 2) return alert('Invalid file format.');

        const headers = json[0].map(h => String(h || '').trim());
        const rows = json.slice(1).map(row => row.map(v => String(v || '').trim()));

        setCsvPreview({ headers, rows });

        const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
        const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };

        headers.forEach(h => {
          const lh = h.toLowerCase();
          if (['roll no', 'roll', 'id', 'sr no'].includes(lh)) initialMap.rollNo = h;
          if (['name', 'student', 'student name'].includes(lh)) initialMap.name = h;
          subjects.forEach(s => {
            // Fix: Cast subject key to string for lowercase comparison and record assignment to avoid index signature issues
            const subjectKeyStr = s.key as string;
            if (s.label.toLowerCase() === lh || subjectKeyStr.toLowerCase() === lh) {
              initialMap.subjectMapping[subjectKeyStr] = h;
            }
          });
        });
        setMapping(initialMap);
      } catch (err) {
        alert('File error.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) return alert('Map columns first.');
    const nameIdx = csvPreview.headers.indexOf(mapping.name);
    const rollIdx = csvPreview.headers.indexOf(mapping.rollNo);
    const targetClass = user?.role === Role.CLASS_INCHARGE ? user.assignedClass! : activeClass;

    const imported: Student[] = csvPreview.rows.map((row, idx) => {
      const studentMarks: Record<string, number> = {};
      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const hIdx = csvPreview.headers.indexOf(header);
        const mKey = getMarkKey(activeExamType, key);
        studentMarks[mKey] = parseInt(row[hIdx]) || 0;
      });
      return {
        id: `imp-${Date.now()}-${idx}`,
        rollNo: row[rollIdx],
        name: row[nameIdx],
        classLevel: targetClass,
        marks: studentMarks
      };
    });
    setStudents(prev => [...prev, ...imported]);
    setCsvPreview(null);
  };

  const handleDashboardSubjectClick = (subject: keyof StudentMarks) => {
    setDashboardFilter(prev => ({ ...prev, subject: prev.subject === subject ? null : subject }));
    setView('sheet');
  };

  const handleDashboardBandClick = (band: string) => {
    setDashboardFilter(prev => ({ ...prev, band: prev.band === band ? null : band }));
    setView('sheet');
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            results={classResults} 
            allStudents={students} 
            className={activeClass} 
            onClassChange={(cls) => setActiveClass(cls)}
            onNavigate={(v) => setView(v)}
            examType={activeExamType}
            activeFilters={dashboardFilter}
            onSubjectClick={handleDashboardSubjectClick}
            onBandClick={handleDashboardBandClick}
            onClearFilters={() => setDashboardFilter({ subject: null, band: null })}
          />
        );
      case 'attendance':
        return (
          <AttendanceManager 
            classLevel={activeClass} 
            students={students.filter(s => s.classLevel === activeClass)} 
          />
        );
      case 'homework':
        return <HomeworkTracker classLevel={activeClass} />;
      case 'sheet':
        return (
          <ResultTable 
            results={classResults} 
            classLevel={activeClass} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            highlightSubject={sortBySubject || dashboardFilter.subject}
            activeFilters={dashboardFilter}
            onClearFilters={() => setDashboardFilter({ subject: null, band: null })}
            examType={activeExamType}
            onExamTypeChange={setActiveExamType}
          />
        );
      case 'entry':
        return (
          <StudentForm 
            onAdd={handleAddOrUpdate} 
            onCancel={() => setView('sheet')} 
            editStudent={editingStudent || undefined} 
            examType={activeExamType}
          />
        );
      case 'entry-portal':
        return (
          <SubjectEntryForm 
            classLevel={activeClass} 
            students={students.filter(s => s.classLevel === activeClass)} 
            onSave={handleBulkUpdate} 
            onCancel={() => setView('sheet')} 
            examType={activeExamType}
            onExamTypeChange={setActiveExamType}
          />
        );
      case 'staff':
        return <StaffManagement />;
      default:
        return (
          <Dashboard 
            results={classResults} 
            allStudents={students} 
            className={activeClass} 
            onNavigate={setView} 
            examType={activeExamType}
            activeFilters={dashboardFilter}
            onSubjectClick={handleDashboardSubjectClick}
            onBandClick={handleDashboardBandClick}
            onClearFilters={() => setDashboardFilter({ subject: null, band: null })}
          />
        );
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
                  <span className="px-6 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-lg">CLASS {activeClass}</span>
                ) : (
                  ALL_CLASSES.filter(c => accessibleClasses.includes(c)).map(cls => (
                    <button key={cls} onClick={() => setActiveClass(cls)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClass === cls ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>C-{cls}</button>
                  ))
                )}
             </div>
          </div>

          <div className="flex gap-3">
            {(user?.role === Role.ADMIN || user?.role === Role.CLASS_INCHARGE) && (
              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                   <i className="fa-solid fa-file-excel"></i>
                 </button>
                 <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-widest">
                   <i className="fa-solid fa-plus-circle mr-2"></i>New Enrollment
                 </button>
              </div>
            )}
            <button onClick={logout} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 transition-all">
              <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f8fafc]">
           <div className="max-w-7xl mx-auto">
             {renderContent()}
           </div>
        </main>
        
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" />

        {csvPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">Excel Import Wizard</h3>
                  <p className="text-xs text-indigo-100 font-bold uppercase mt-1">
                     {user?.role === Role.CLASS_INCHARGE ? `Forcing Class ${user.assignedClass}` : `Importing to Class ${activeClass}`}
                  </p>
                </div>
                <button onClick={() => setCsvPreview(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Roll Number Header</label>
                    <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                      <option value="">-- Select --</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Name Header</label>
                    <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                      <option value="">-- Select --</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Subject Mapping</span>
                  <div className="grid grid-cols-2 gap-4">
                    {GET_SUBJECTS_FOR_CLASS(activeClass).map(sub => (
                      <div key={sub.key}>
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block truncate">{sub.label}</label>
                        <select 
                          value={mapping.subjectMapping[sub.key] || ''} 
                          onChange={e => setMapping({
                            ...mapping, 
                            subjectMapping: { ...mapping.subjectMapping, [sub.key]: e.target.value }
                          })}
                          className="w-full p-2 bg-white border border-slate-100 rounded-lg text-xs font-bold"
                        >
                          <option value="">-- Skip --</option>
                          {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setCsvPreview(null)} className="px-8 font-black text-slate-400 uppercase text-xs">Cancel</button>
                <button onClick={processImport} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Finalize Import</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
