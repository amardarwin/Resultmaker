import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, ClassLevel, StudentMarks, ColumnMapping, Role, ExamType } from './types';
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

// ✅ Fix 1: Removed 'examRules' import and defined helper here
const getMarkKey = (examType: string, subjectKey: string) => {
  return `${String(examType).toLowerCase()}_${subjectKey.toLowerCase()}`;
};

const AppContent: React.FC = () => {
  const { user, schoolConfig, logout, isViewRestricted, accessibleClasses } = useAuth();
  
  const [activeClass, setActiveClass] = useState<ClassLevel>('10'); // Default to 10
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

  const [csvPreview, setCsvPreview] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ rollNo: '', name: '', subjectMapping: {} });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.assignedClass && ALL_CLASSES.includes(user.assignedClass as any)) {
      setActiveClass(user.assignedClass as ClassLevel);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    try {
      const effectiveSort = sortBySubject || undefined;
      // Filter students by active class before ranking
      const currentClassStudents = students.filter(s => s.classLevel === activeClass);
      let results = rankStudents(currentClassStudents, activeClass, activeExamType, effectiveSort as string);
      
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
      // Create a map of updated students for faster lookup
      const updatedMap = new Map(updatedStudents.map(s => [s.id, s]));
      
      // Return new array: if student is in updatedMap, use that, else use existing
      const newStudents = prev.map(s => updatedMap.get(s.id) || s);
      
      // If there are new students that weren't in prev (unlikely in this flow but possible)
      const newIds = new Set(prev.map(s => s.id));
      const brandNew = updatedStudents.filter(s => !newIds.has(s.id));
      
      return [...newStudents, ...brandNew];
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const target = event.target?.result;
        if (!target) return;
        const data = new Uint8Array(target as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (json.length < 2) return alert("File Import Error: No data rows found.");

        const headers = json[0].map(h => String(h || '').trim());
        const rows = json.slice(1).map(row => row.map(v => String(v ?? '').trim()));
        setCsvPreview({ headers, rows });

        const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
        const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };

        headers.forEach(h => {
          const lh = h.toLowerCase();
          if (['roll no', 'roll', 'id', 'rollno', 'r.no'].includes(lh)) initialMap.rollNo = h;
          if (['name', 'student', 'student name', 'studentname'].includes(lh)) initialMap.name = h;
          subjects.forEach(s => {
            if (s.label.toLowerCase() === lh || s.key.toLowerCase() === lh) {
              initialMap.subjectMapping[s.key] = h;
            }
          });
        });
        setMapping(initialMap);
      } catch (err) {
        alert("Excel parse error. The file structure might be corrupted.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) return alert("Mapping Incomplete: Identify Roll No and Name columns.");
    const nameIdx = csvPreview.headers.indexOf(mapping.name);
    const rollIdx = csvPreview.headers.indexOf(mapping.rollNo);
    const targetClass = activeClass;

    const imported: Student[] = csvPreview.rows.map((row, idx) => {
      const studentMarks: Record<string, number> = {};
      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const hIdx = csvPreview.headers.indexOf(header);
        if (hIdx !== -1) {
          const mKey = getMarkKey(activeExamType, key);
          const valStr = row[hIdx];
          const valNum = parseInt(valStr);
          studentMarks[mKey] = isNaN(valNum) ? 0 : valNum;
        }
      });
      return {
        id: `imp-${Date.now()}-${idx}`,
        rollNo: row[rollIdx] || `R-${idx + 1}`,
        name: row[nameIdx] || `Student ${idx + 1}`,
        classLevel: targetClass,
        marks: studentMarks
      };
    });
    setStudents(prev => [...prev.filter(s => s.classLevel !== targetClass), ...imported]);
    setCsvPreview(null);
    alert(`Success: Imported ${imported.length} student records into Class ${targetClass} for ${activeExamType}.`);
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
        // ✅ Fix 2: Updated props to match the new SubjectEntryForm
        return (
          <SubjectEntryForm 
            students={students} // Pass ALL students (Form handles filtering)
            onSave={handleBulkUpdate} 
            onCancel={() => setView('dashboard')} 
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
            {view !== 'entry-portal' && !isViewRestricted && (
              <div className="flex items-center gap-2">
                 <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"><i className="fa-solid fa-file-excel"></i></button>
                 <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest">Enrollment</button>
              </div>
            )}
            <button onClick={logout} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 transition-all shadow-sm"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
           <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" />
        {csvPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black">Excel Mapping Utility</h3>
                <button onClick={() => setCsvPreview(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-xs font-bold text-slate-500">Mapping data for <span className="text-indigo-600">Class {activeClass}</span> during <span className="text-indigo-600">{activeExamType}</span>.</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Roll No Column</label>
                    <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      <option value="">-- Choose Header --</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Student Name Column</label>
                    <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      <option value="">-- Choose Header --</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setCsvPreview(null)} className="px-8 font-black text-slate-400 uppercase text-xs">Cancel</button>
                <button onClick={processImport} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl">Finalize Import</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
