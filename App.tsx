
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
    try {
      const saved = localStorage.getItem('school_results_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
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
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) return alert('Invalid CSV: Header and data required.');
      
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
      
      setCsvPreview({ headers, rows });
      setImportReport(null);
      
      const subjects = GET_SUBJECTS_FOR_CLASS(activeClass);
      const initialMap: ColumnMapping = { rollNo: '', name: '', subjectMapping: {} };
      
      headers.forEach(h => {
        const lh = h.toLowerCase();
        if (['roll no', 'roll', 'id', 'sr no'].includes(lh)) initialMap.rollNo = h;
        if (['name', 'student name', 'full name'].includes(lh)) initialMap.name = h;
        subjects.forEach(s => {
          if (s.label.toLowerCase() === lh || s.key.toLowerCase() === lh) {
            initialMap.subjectMapping[s.key] = h;
          }
        });
      });
      setMapping(initialMap);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processImport = () => {
    if (!csvPreview || !mapping.name || !mapping.rollNo) {
      return alert('Error: Map Roll No and Name columns.');
    }
    
    const nameIdx = csvPreview.headers.indexOf(mapping.name);
    const rollIdx = csvPreview.headers.indexOf(mapping.rollNo);
    
    const imported: Student[] = [];
    const errors: string[] = [];
    let successCount = 0;

    csvPreview.rows.forEach((row, idx) => {
      if (row.length <= 1 && !row[0]) return;
      const rollNo = row[rollIdx];
      const name = row[nameIdx];
      if (!rollNo || !name) {
        errors.push(`Row ${idx + 2}: Missing identity data.`);
        return;
      }

      const studentMarks: any = {};
      Object.entries(mapping.subjectMapping).forEach(([key, header]) => {
        const hIdx = csvPreview.headers.indexOf(header);
        const val = parseInt(row[hIdx]);
        studentMarks[key] = isNaN(val) ? 0 : val;
      });

      imported.push({
        id: `imp-${Date.now()}-${idx}`,
        rollNo, name, classLevel: activeClass, marks: studentMarks as StudentMarks
      });
      successCount++;
    });

    setStudents(prev => [...prev, ...imported]);
    if (errors.length === 0) {
      setCsvPreview(null);
      alert(`Imported ${successCount} students.`);
    } else {
      setImportReport({ success: successCount, errors });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />

      {csvPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">CSV Mapping</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase">Class {activeClass}</p>
              </div>
              <button onClick={() => setCsvPreview(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <select value={mapping.rollNo} onChange={e => setMapping({...mapping, rollNo: e.target.value})} className="p-3 bg-slate-50 border rounded-xl font-bold">
                  <option value="">Select Roll No</option>
                  {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="p-3 bg-slate-50 border rounded-xl font-bold">
                  <option value="">Select Name</option>
                  {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {GET_SUBJECTS_FOR_CLASS(activeClass).map(sub => (
                  <div key={sub.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-black uppercase text-slate-600">{sub.label}</span>
                    <select 
                      value={mapping.subjectMapping[sub.key] || ''} 
                      onChange={e => setMapping({...mapping, subjectMapping: {...mapping.subjectMapping, [sub.key]: e.target.value}})}
                      className="p-2 border rounded-lg text-xs font-bold w-48"
                    >
                      <option value="">Skip</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setCsvPreview(null)} className="px-6 font-bold text-slate-400">Cancel</button>
              <button onClick={processImport} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl">FINISH</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('sheet')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap"></i></div>
          <h1 className="text-xl font-black text-slate-800">EduRank</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-xs font-black">New Record</button>
        </div>
      </header>

      <div className="bg-white border-b sticky top-16 z-40 py-3 px-4 flex justify-between items-center">
        <div className="flex gap-1">
          {ALL_CLASSES.map(cls => (
            <button key={cls} onClick={() => setActiveClass(cls)} className={`px-4 py-1.5 rounded-lg text-xs font-black ${activeClass === cls ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>C-{cls}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView('sheet')} className={`text-xs font-bold ${view === 'sheet' ? 'text-indigo-600' : 'text-slate-400'}`}>Result Sheet</button>
          <button onClick={() => setView('dashboard')} className={`text-xs font-bold ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>Analytics</button>
          <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-slate-400 border px-3 py-1 rounded">Import CSV</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'entry' ? (
          <StudentForm onAdd={handleAddOrUpdate} onCancel={() => setView('sheet')} editStudent={editingStudent || undefined} />
        ) : view === 'subject-entry' ? (
          <SubjectEntryForm classLevel={activeClass} students={students.filter(s => s.classLevel === activeClass)} onSave={handleBulkUpdate} onCancel={() => setView('sheet')} initialMaxMarks={maxMarks} />
        ) : view === 'dashboard' ? (
          <Dashboard 
            results={classResults} 
            allStudents={students} 
            className={activeClass} 
            onSubjectHighlight={(s) => setSortBySubject(s)}
            activeSubjectFilter={sortBySubject}
          />
        ) : (
          <ResultTable results={classResults} classLevel={activeClass} onEdit={handleEdit} onDelete={handleDelete} highlightSubject={sortBySubject} />
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white/80 border-t py-2 px-6 flex justify-between text-[9px] font-black uppercase text-slate-400">
        <div>Database Connected • {activeClass}</div>
        <div>Standardized Result Engine V3.5</div>
      </footer>
    </div>
  );
};

export default App;
