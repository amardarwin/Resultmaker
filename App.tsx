
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ClassLevel, CalculatedResult } from './types';
import { ALL_CLASSES } from './constants';
import { rankStudents } from './utils/calculations';
import { exportToCSV } from './utils/export';
import { parseCSV } from './utils/import';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import ResultTable from './components/ResultTable';
import SubjectEntryForm from './components/SubjectEntryForm';

const App: React.FC = () => {
  const [activeClass, setActiveClass] = useState<ClassLevel>('6');
  const [maxMarks, setMaxMarks] = useState(100);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_results_students');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'sheet' | 'dashboard' | 'entry' | 'subject-entry'>('sheet');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    return rankStudents(students, activeClass, maxMarks);
  }, [students, activeClass, maxMarks]);

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      <input type="file" ref={fileInputRef} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const imported = await parseCSV(file, activeClass);
          setStudents(prev => [...prev, ...imported]);
          alert(`Successfully imported ${imported.length} students to Class ${activeClass}`);
        } catch (err: any) { alert(err.message); }
      }} accept=".csv" className="hidden" />

      {/* Primary Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
              <i className="fa-solid fa-graduation-cap text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">EduRank Pro</h1>
              <p className="text-[9px] uppercase font-black text-indigo-500 tracking-widest leading-none">Result Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Exam Cycle Selector */}
            <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 ring-4 ring-slate-50">
              <label className="text-[10px] font-black text-slate-400 uppercase px-3">Exam Scale</label>
              {[20, 80, 100].map(val => (
                <button 
                  key={val}
                  onClick={() => setMaxMarks(val)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${maxMarks === val ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {val === 20 ? 'Bimonthly' : val === 80 ? 'Term' : 'Final'} ({val})
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>

            <button onClick={() => { setEditingStudent(null); setView('entry'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center transition-all hover:-translate-y-0.5 active:translate-y-0">
              <i className="fa-solid fa-user-plus mr-2"></i> New Entry
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar / Secondary Nav */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {ALL_CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => setActiveClass(cls)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${activeClass === cls ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                CLASS {cls}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button onClick={() => setView('sheet')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'sheet' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-table mr-2"></i> Result Sheet
            </button>
            <button onClick={() => setView('subject-entry')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'subject-entry' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-list-check mr-2"></i> Subject Wise
            </button>
            <button onClick={() => setView('dashboard')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-chart-simple mr-2"></i> Stats
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200">
              <i className="fa-solid fa-file-import mr-2"></i> Import
            </button>
            <button onClick={() => exportToCSV(classResults, activeClass)} className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-100">
              <i className="fa-solid fa-file-export mr-2"></i> Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'entry' ? (
          <div className="max-w-4xl mx-auto">
            <StudentForm 
              onAdd={handleAddOrUpdate} 
              onCancel={() => setView('sheet')} 
              editStudent={editingStudent || undefined} 
            />
          </div>
        ) : view === 'subject-entry' ? (
          <div className="max-w-5xl mx-auto">
            <SubjectEntryForm 
              classLevel={activeClass} 
              students={students.filter(s => s.classLevel === activeClass)} 
              onSave={handleBulkUpdate} 
              onCancel={() => setView('sheet')} 
              initialMaxMarks={maxMarks}
            />
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard results={classResults} className={activeClass} />
        ) : (
          <ResultTable results={classResults} classLevel={activeClass} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </main>

      {/* Footer Utility Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 py-3 px-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              System Database Ready
            </div>
            <div className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Current Exam Cycle: {maxMarks === 20 ? 'Bimonthly' : maxMarks === 80 ? 'Term Exam' : 'Final Exam'} ({maxMarks} Marks)
            </div>
          </div>
          <div className="text-slate-300 hidden sm:block">
            PSEB Punjab Standard Compliant • V3.2.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
