
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
  const [importReport, setImportReport] = useState<{ success: number, errors: string[] } | null>(null);
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
      // Split by lines and filter out empty ones
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) return alert('Invalid CSV: The file must contain a header row and at least one data row.');
      
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
      
      setCsvPreview({ headers, rows });
      setImportReport(null);
      
      // Auto-suggest mapping based on common names
      const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
      const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };
      
      headers.forEach(h => {
        const lh = h.toLowerCase();
        if (['roll no', 'roll', 'id', 'student id', 'sr no'].includes(lh)) initialMap.rollNo = h;
        if (['name', 'student name', 'full name', 'student'].includes(lh)) initialMap.name = h;
        
        subjects.forEach(s => {
          if (s.label.toLowerCase() === lh || s.key.toLowerCase() === lh) {
            initialMap.subjectMapping[s.key] = h;
          }
        });
      });
      setMapping(initialMap);
    };
    reader.readAsText(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) {
      return alert('Mapping Error: You must select which columns contain the "Roll No" and "Name".');
    }
    
    const nameIdx = csvPreview.headers.indexOf(mapping.name);
    const rollIdx = csvPreview.headers.indexOf(mapping.rollNo);
    
    const imported: Student[] = [];
    const errors: string[] = [];
    let successCount = 0;

    csvPreview.rows.forEach((row, idx) => {
      // Row validation: Skip completely empty rows
      if (row.length <= 1 && !row[0]) return;

      const rollNo = row[rollIdx];
      const name = row[nameIdx];

      if (!rollNo || !name) {
        errors.push(`Row ${idx + 2}: Missing Roll No or Name.`);
        return;
      }

      // Check for duplicate Roll No in the same class (optional but safer)
      // For now, we allow it but validate markers
      const studentMarks: any = {};
      let hasInvalidMark = false;

      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const headerIdx = csvPreview.headers.indexOf(header);
        const valStr = row[headerIdx];
        if (valStr === undefined || valStr === '') {
          studentMarks[key] = 0;
        } else {
          const val = parseInt(valStr);
          if (isNaN(val)) {
            hasInvalidMark = true;
            studentMarks[key] = 0; // Default to 0 but mark as error
          } else {
            studentMarks[key] = val;
          }
        }
      });

      if (hasInvalidMark) {
        errors.push(`Row ${idx + 2} (${name}): Some marks were invalid (non-numeric) and were defaulted to 0.`);
      }

      imported.push({
        id: `imp-${Date.now()}-${idx}`,
        rollNo,
        name,
        classLevel: activeClass,
        marks: studentMarks as StudentMarks
      });
      successCount++;
    });

    setStudents(prev => [...prev, ...imported]);
    setImportReport({ success: successCount, errors });
    
    if (errors.length === 0) {
      setCsvPreview(null);
      alert(`Import Successful! Added ${successCount} students.`);
    }
    // If there are errors, we keep the modal open to let the user see the report
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />

      {/* Enhanced Import Modal */}
      {csvPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Configure Import Mapping</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Class Level: {activeClass}</p>
              </div>
              <button 
                onClick={() => setCsvPreview(null)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {importReport && importReport.errors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <h4 className="text-amber-800 font-black text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i> Import Warnings ({importReport.errors.length})
                  </h4>
                  <ul className="text-[11px] text-amber-700 font-medium list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {importReport.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Map Roll No Column</label>
                  <select 
                    value={mapping.rollNo} 
                    onChange={e => setMapping({...mapping, rollNo: e.target.value})} 
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-black text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Select Column --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Map Name Column</label>
                  <select 
                    value={mapping.name} 
                    onChange={e => setMapping({...mapping, name: e.target.value})} 
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-black text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Select Column --</option>
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Subject Columns Mapping</label>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Optional</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {GET_SUBJECTS_FOR_CLASS(activeClass).map(sub => (
                    <div key={sub.key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${sub.type === 'MAIN' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                        <span className="font-black text-xs text-slate-700 uppercase">{sub.label}</span>
                      </div>
                      <select 
                        value={mapping.subjectMapping[sub.key] || ''} 
                        onChange={e => setMapping({...mapping, subjectMapping: {...mapping.subjectMapping, [sub.key]: e.target.value}})}
                        className="p-2 bg-white rounded-lg border-2 border-slate-100 font-black text-[11px] min-w-[180px] outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Skip Column --</option>
                        {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase">
                Ready to import {csvPreview.rows.length} rows
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCsvPreview(null)} 
                  className="px-6 py-3 font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={processImport} 
                  className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-file-import"></i>
                  {importReport ? 'RE-IMPORT WITH CHANGES' : 'PROCESS IMPORT'}
                </button>
              </div>
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
