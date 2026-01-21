
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, ClassLevel, CalculatedResult, StudentMarks, ColumnMapping, Role } from './types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from './constants';
import { rankStudents } from './utils/calculations';
import { exportToCSV } from './utils/export';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import ResultTable from './components/ResultTable';
import SubjectEntryForm from './components/SubjectEntryForm';
import StaffManagement from './components/StaffManagement';
import SchoolSetup from './components/SchoolSetup';
import LoginScreen from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, schoolConfig, logout, isViewRestricted, canEditStudent } = useAuth();
  const [activeClass, setActiveClass] = useState<ClassLevel>('6');
  const [maxMarks, setMaxMarks] = useState(100);
  const [sortBySubject, setSortBySubject] = useState<keyof StudentMarks | null>(null);
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('school_results_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [view, setView] = useState<'sheet' | 'dashboard' | 'entry' | 'subject-entry' | 'staff'>('sheet');
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
    let results = rankStudents(students, activeClass, maxMarks, sortBySubject || undefined);
    if (user?.role === Role.STUDENT && user.rollNo) {
      results = results.filter(r => r.rollNo === user.rollNo);
    }
    return results;
  }, [students, activeClass, maxMarks, sortBySubject, user]);

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
          if (['name', 'student'].includes(lh)) initialMap.name = h;
          subjects.forEach(s => {
            if (s.label.toLowerCase() === lh || s.key.toLowerCase() === lh) initialMap.subjectMapping[s.key] = h;
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
    const imported: Student[] = csvPreview.rows.map((row, idx) => {
      const studentMarks: any = {};
      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const hIdx = csvPreview.headers.indexOf(header);
        studentMarks[key] = parseInt(row[hIdx]) || 0;
      });
      return {
        id: `imp-${Date.now()}-${idx}`,
        rollNo: row[rollIdx],
        name: row[nameIdx],
        classLevel: activeClass,
        marks: studentMarks as StudentMarks
      };
    });
    setStudents(prev => [...prev, ...imported]);
    setCsvPreview(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" />

      {csvPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black">Data Import Wizard</h3>
              <button onClick={() => setCsvPreview(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Roll No</label>
                  <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                    <option value="">-- Select --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Name</label>
                  <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                    <option value="">-- Select --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 border-t flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setCsvPreview(null)} className="px-6 font-bold text-slate-400">Cancel</button>
              <button onClick={processImport} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl">IMPORT</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('sheet')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fa-solid fa-graduation-cap text-xl"></i></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{schoolConfig.schoolName}</h1>
            <p className="text-[9px] font-black text-indigo-500 uppercase leading-none">{user.name} ({user.role.replace('_', ' ')})</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditStudent(activeClass) && (
            <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
              <i className="fa-solid fa-plus mr-2"></i>New Record
            </button>
          )}
          <button onClick={logout} className="text-slate-400 hover:text-red-500 font-black text-xs px-4 flex items-center transition-colors">
            <i className="fa-solid fa-right-from-bracket mr-2"></i>LOGOUT
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100 sticky top-16 z-40 py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {isViewRestricted ? (
            <span className="px-5 py-2 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-sm">Class {activeClass}</span>
          ) : (
            ALL_CLASSES.map(cls => (
              <button key={cls} onClick={() => setActiveClass(cls)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeClass === cls ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>C-{cls}</button>
            ))
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto w-full md:w-auto justify-center md:justify-end pb-2 md:pb-0">
          <button onClick={() => setView('sheet')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'sheet' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Sheet</button>
          {user.role !== Role.STUDENT && (
            <>
              <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Analytics</button>
              <button onClick={() => setView('subject-entry')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'subject-entry' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Entry</button>
            </>
          )}
          {user.role === Role.ADMIN && (
            <>
              <button onClick={() => setView('staff')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'staff' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Staff</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all flex items-center shrink-0">
                <i className="fa-solid fa-file-excel mr-2 text-emerald-600"></i> Import
              </button>
            </>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'entry' ? (
          <StudentForm onAdd={handleAddOrUpdate} onCancel={() => setView('sheet')} editStudent={editingStudent || undefined} />
        ) : view === 'staff' && user.role === Role.ADMIN ? (
          <StaffManagement />
        ) : view === 'subject-entry' ? (
          <SubjectEntryForm classLevel={activeClass} students={students.filter(s => s.classLevel === activeClass)} onSave={handleBulkUpdate} onCancel={() => setView('sheet')} initialMaxMarks={maxMarks} />
        ) : view === 'dashboard' ? (
          <Dashboard results={classResults} allStudents={students} className={activeClass} onSubjectHighlight={(s) => setSortBySubject(s)} activeSubjectFilter={sortBySubject} />
        ) : (
          <ResultTable results={classResults} classLevel={activeClass} onEdit={handleEdit} onDelete={handleDelete} highlightSubject={sortBySubject} />
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-3 px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 z-50">
        <div>Session: {user.role} • {user.name}</div>
        <div>EduRank High-Performance Engine V5.0</div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
