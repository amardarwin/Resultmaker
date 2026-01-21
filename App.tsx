
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ClassLevel, CalculatedResult, StudentMarks, ColumnMapping } from './types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from './constants';
import { rankStudents } from './utils/calculations';
import { exportToCSV } from './utils/export';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import ResultTable from './components/ResultTable';
import SubjectEntryForm from './components/SubjectEntryForm';

const App: React.FC = () => {
  const [activeClass, setActiveClass] = useState<ClassLevel>('6');
  const [maxMarks, setMaxMarks] = useState(100);
  const [sortBySubject, setSortBySubject] = useState<keyof StudentMarks | null>(null);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_results_students');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'sheet' | 'dashboard' | 'entry' | 'subject-entry'>('sheet');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // CSV Import States
  const [csvPreview, setCsvPreview] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ rollNo: '', name: '', subjectMapping: {} });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    return rankStudents(students, activeClass, maxMarks, sortBySubject || undefined);
  }, [students, activeClass, maxMarks, sortBySubject]);

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
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) return alert('Invalid CSV');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
      setCsvPreview({ headers, rows });
      
      // Auto-suggest mapping
      const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
      const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };
      headers.forEach(h => {
        const lh = h.toLowerCase();
        if (lh === 'roll no' || lh === 'roll' || lh === 'id') initialMap.rollNo = h;
        if (lh === 'name' || lh === 'student name' || lh === 'student') initialMap.name = h;
        subjects.forEach(s => {
          if (s.label.toLowerCase() === lh) initialMap.subjectMapping[s.key] = h;
        });
      });
      setMapping(initialMap);
    };
    reader.readAsText(file);
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) return alert('Please map Roll No and Name columns');
    
    const imported: Student[] = csvPreview.rows.map((row, idx) => {
      const rollNo = row[csvPreview.headers.indexOf(mapping.rollNo)] || `R-${idx}`;
      const name = row[csvPreview.headers.indexOf(mapping.name)] || 'Unknown';
      const studentMarks: any = {};
      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const val = parseInt(row[csvPreview.headers.indexOf(header)]);
        studentMarks[key] = isNaN(val) ? 0 : val;
      });
      return {
        id: `imp-${Date.now()}-${idx}`,
        rollNo, name, classLevel: activeClass, marks: studentMarks as StudentMarks
      };
    });

    setStudents(prev => [...prev, ...imported]);
    setCsvPreview(null);
    alert(`Imported ${imported.length} students`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />

      {/* Import Modal */}
      {csvPreview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Map CSV Columns (Class {activeClass})</h3>
              <button onClick={() => setCsvPreview(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Roll No Header</label>
                  <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg border font-bold">
                    <option value="">Select Column</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Name Header</label>
                  <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg border font-bold">
                    <option value="">Select Column</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Subject Mapping</label>
                {GET_SUBJECTS_FOR_CLASS(activeClass).map(sub => (
                  <div key={sub.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-black text-xs text-slate-600 uppercase">{sub.label}</span>
                    <select 
                      value={mapping.subjectMapping[sub.key] || ''} 
                      onChange={e => setMapping({...mapping, subjectMapping: {...mapping.subjectMapping, [sub.key]: e.target.value}})}
                      className="p-1.5 bg-white rounded-lg border font-bold text-xs min-w-[150px]"
                    >
                      <option value="">Skip Subject</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setCsvPreview(null)} className="px-6 py-2 font-bold text-slate-400">Cancel</button>
              <button onClick={processImport} className="px-8 py-2 bg-indigo-600 text-white font-black rounded-xl">FINISH IMPORT</button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('sheet')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fa-solid fa-graduation-cap text-xl"></i></div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">EduRank Pro</h1>
              <p className="text-[9px] uppercase font-black text-indigo-500 tracking-widest leading-none">Smart Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              {[20, 80, 100].map(val => (
                <button key={val} onClick={() => setMaxMarks(val)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${maxMarks === val ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  Scale {val}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center transition-all hover:-translate-y-0.5">
              <i className="fa-solid fa-user-plus mr-2"></i> New Record
            </button>
          </div>
        </div>
      </header>

      {/* Controls Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {ALL_CLASSES.map(cls => (
              <button key={cls} onClick={() => setActiveClass(cls)} className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${activeClass === cls ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                C-{cls}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button onClick={() => setView('sheet')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'sheet' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-table mr-2"></i> Result Sheet
            </button>
            <button onClick={() => setView('subject-entry')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'subject-entry' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-list-check mr-2"></i> Award Entry
            </button>
            <button onClick={() => setView('dashboard')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-chart-simple mr-2"></i> Analytics
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200">
              <i className="fa-solid fa-file-import mr-2"></i> Import CSV
            </button>
            <button onClick={() => exportToCSV(classResults, activeClass)} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-100">
              <i className="fa-solid fa-file-export mr-2"></i> Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'entry' ? (
          <div className="max-w-4xl mx-auto"><StudentForm onAdd={handleAddOrUpdate} onCancel={() => setView('sheet')} editStudent={editingStudent || undefined} /></div>
        ) : view === 'subject-entry' ? (
          <div className="max-w-5xl mx-auto"><SubjectEntryForm classLevel={activeClass} students={students.filter(s => s.classLevel === activeClass)} onSave={handleBulkUpdate} onCancel={() => setView('sheet')} initialMaxMarks={maxMarks} /></div>
        ) : view === 'dashboard' ? (
          <Dashboard 
            results={classResults} 
            allStudents={students} 
            className={activeClass} 
            onSubjectHighlight={(s) => { setSortBySubject(s); setView('sheet'); }}
            activeSubjectFilter={sortBySubject}
          />
        ) : (
          <ResultTable results={classResults} classLevel={activeClass} onEdit={handleEdit} onDelete={handleDelete} highlightSubject={sortBySubject} />
        )}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 py-3 px-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center space-x-6">
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Database Connected</div>
            <div className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Cycle: {maxMarks} Marks System</div>
          </div>
          <div className="hidden sm:block">PSEB Standard Compliant System • V3.3.0</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
