
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
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, login, logout, isViewRestricted, canEditStudent } = useAuth();
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
  const [view, setView] = useState<'sheet' | 'dashboard' | 'entry' | 'subject-entry'>('sheet');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [credentials, setCredentials] = useState({ user: '', pass: '' });

  // Import States
  const [csvPreview, setCsvPreview] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ rollNo: '', name: '', subjectMapping: {} });
  const [importReport, setImportReport] = useState<{ success: number, errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-set assigned class for Incharges
  useEffect(() => {
    if (user?.role === Role.CLASS_INCHARGE && user.assignedClass) {
      setActiveClass(user.assignedClass);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl shadow-xl rotate-6 mb-6">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800">EduRank Pro</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Secure Academic Gateway</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); login(credentials.user, credentials.pass); }} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Username</label>
              <input type="text" value={credentials.user} onChange={e => setCredentials({...credentials, user: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all" placeholder="Enter ID" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Password</label>
              <input type="password" value={credentials.pass} onChange={e => setCredentials({...credentials, pass: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
              AUTHENTICATE
            </button>
            <div className="pt-4 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                Head: head/admin | Incharge: incharge10/123 <br/>
                Teacher: mathsir/123 | Student: 1/pass
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

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

        if (json.length < 2) {
          return alert('Invalid file: The file must contain a header row and at least one data row.');
        }

        const headers = json[0].map(h => String(h || '').trim());
        const rows = json.slice(1).map(row => 
          row.map(v => String(v === undefined || v === null ? '' : v).trim())
        );

        setCsvPreview({ headers, rows });
        setImportReport(null);

        const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
        const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };

        headers.forEach(h => {
          const lh = h.toLowerCase();
          if (['roll no', 'roll', 'id', 'sr no', 'rollno', 'rno'].includes(lh)) initialMap.rollNo = h;
          if (['name', 'student name', 'full name', 'student'].includes(lh)) initialMap.name = h;
          subjects.forEach(s => {
            if (s.label.toLowerCase() === lh || s.key.toLowerCase() === lh) {
              initialMap.subjectMapping[s.key] = h;
            }
          });
        });
        setMapping(initialMap);
      } catch (err) {
        console.error(err);
        alert('Error reading file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) {
      return alert('Error: Please map both Roll No and Name columns.');
    }

    const nameIdx = csvPreview.headers.indexOf(mapping.name);
    const rollIdx = csvPreview.headers.indexOf(mapping.rollNo);

    const imported: Student[] = [];
    const errors: string[] = [];
    let successCount = 0;

    csvPreview.rows.forEach((row, idx) => {
      if (row.length === 0 || row.every(cell => cell === '')) return;

      const rollNo = row[rollIdx];
      const name = row[nameIdx];

      if (!rollNo || !name) {
        errors.push(`Row ${idx + 2}: Missing identity data (Roll No or Name).`);
        return;
      }

      const studentMarks: any = {};
      let rowHasInvalidMark = false;

      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const hIdx = csvPreview.headers.indexOf(header);
        const rawVal = row[hIdx];
        if (rawVal === undefined || rawVal === '') {
          studentMarks[key] = 0;
        } else {
          const val = parseInt(rawVal);
          if (isNaN(val)) {
            rowHasInvalidMark = true;
            studentMarks[key] = 0;
          } else {
            studentMarks[key] = val;
          }
        }
      });

      if (rowHasInvalidMark) {
        errors.push(`Row ${idx + 2} (${name}): Contains non-numeric marks; defaulted to 0.`);
      }

      imported.push({
        id: `imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        rollNo,
        name,
        classLevel: activeClass,
        marks: studentMarks as StudentMarks
      });
      successCount++;
    });

    setStudents(prev => [...prev, ...imported]);
    
    if (errors.length > 0) {
      setImportReport({ success: successCount, errors });
      alert(`Import completed with ${errors.length} warnings. Review the report in the modal.`);
    } else {
      setCsvPreview(null);
      alert(`Import successful! Added ${successCount} students.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" />

      {csvPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Data Import Wizard</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Class {activeClass} • Mapping Configuration</p>
              </div>
              <button onClick={() => setCsvPreview(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {importReport && importReport.errors.length > 0 && (
                <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl">
                  <h4 className="text-amber-800 font-black text-xs uppercase mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> Import Warnings ({importReport.errors.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto text-[10px] font-bold text-amber-600 space-y-1">
                    {importReport.errors.map((err, i) => <div key={i}>• {err}</div>)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Roll No Column</label>
                  <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all">
                    <option value="">-- Select Column --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Name Column</label>
                  <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all">
                    <option value="">-- Select Column --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Marks Mapping</label>
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">Auto-mapped by label</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {GET_SUBJECTS_FOR_CLASS(activeClass).map(sub => (
                    <div key={sub.key} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${sub.type === 'MAIN' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                        <span className="text-xs font-black uppercase text-slate-600">{sub.label}</span>
                      </div>
                      <select 
                        value={mapping.subjectMapping[sub.key] || ''} 
                        onChange={e => setMapping({...mapping, subjectMapping: {...mapping.subjectMapping, [sub.key]: e.target.value}})}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold w-48 outline-none focus:border-indigo-500"
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
              <button onClick={() => setCsvPreview(null)} className="px-6 font-bold text-slate-400 hover:text-slate-600 text-xs uppercase">Cancel</button>
              <button onClick={processImport} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {importReport ? 'RE-IMPORT' : 'START IMPORT'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('sheet')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fa-solid fa-graduation-cap text-xl"></i></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">EduRank</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase leading-none">{user.username}</p>
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

      <div className="bg-white border-b border-slate-100 sticky top-16 z-40 py-3 px-4 flex flex-col md:flex-row justify-between items-center gap-4">
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
          <button onClick={() => setView('sheet')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'sheet' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <i className="fa-solid fa-table mr-2"></i>Sheet
          </button>
          {user.role !== Role.STUDENT && (
            <>
              <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <i className="fa-solid fa-chart-line mr-2"></i>Analytics
              </button>
              <button onClick={() => setView('subject-entry')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'subject-entry' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <i className="fa-solid fa-keyboard mr-2"></i>Entry
              </button>
            </>
          )}
          {user.role === Role.ADMIN && (
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all flex items-center shrink-0">
              <i className="fa-solid fa-file-excel mr-2 text-emerald-600"></i> Import Excel/CSV
            </button>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'entry' ? (
          <div className="max-w-3xl mx-auto"><StudentForm onAdd={handleAddOrUpdate} onCancel={() => setView('sheet')} editStudent={editingStudent || undefined} /></div>
        ) : view === 'subject-entry' ? (
          <SubjectEntryForm classLevel={activeClass} students={students.filter(s => s.classLevel === activeClass)} onSave={handleBulkUpdate} onCancel={() => setView('sheet')} initialMaxMarks={maxMarks} />
        ) : view === 'dashboard' ? (
          <Dashboard results={classResults} allStudents={students} className={activeClass} onSubjectHighlight={(s) => setSortBySubject(s)} activeSubjectFilter={sortBySubject} />
        ) : (
          <ResultTable results={classResults} classLevel={activeClass} onEdit={handleEdit} onDelete={handleDelete} highlightSubject={sortBySubject} />
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-3 px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 z-50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Active</span>
          <span className="text-indigo-400">Role: {user.role} • {user.username}</span>
        </div>
        <div>EduRank V4.2 High-Performance Engine</div>
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
