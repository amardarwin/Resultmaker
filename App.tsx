
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ClassLevel, CalculatedResult } from './types';
import { ALL_CLASSES } from './constants';
import { rankStudents } from './utils/calculations';
import { exportToCSV } from './utils/export';
import { parseCSV } from './utils/import';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import ResultTable from './components/ResultTable';

const App: React.FC = () => {
  const [activeClass, setActiveClass] = useState<ClassLevel>('6');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_results_students');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'sheet' | 'dashboard'>('sheet');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('school_results_students', JSON.stringify(students));
  }, [students]);

  const classResults = useMemo(() => {
    return rankStudents(students, activeClass);
  }, [students, activeClass]);

  const handleAddOrUpdate = (student: Student) => {
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    } else {
      setStudents(prev => [...prev, student]);
    }
    setIsAdding(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsAdding(true);
  };

  const handleExport = () => {
    exportToCSV(classResults, activeClass);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseCSV(file, activeClass);
      if (imported.length === 0) throw new Error('No valid records found in file');
      
      setStudents(prev => [...prev, ...imported]);
      alert(`Successfully imported ${imported.length} students to Class ${activeClass}`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-graduation-cap text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">EduRank</h1>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">Result System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setView('sheet')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'sheet' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-700 text-slate-500'}`}
              >
                <i className="fa-solid fa-table-list mr-2"></i> Result Sheet
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fa-solid fa-chart-pie mr-2"></i> Performance
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleImportClick}
                title="Import students from CSV"
                className="p-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-file-import md:mr-2"></i>
                <span className="hidden md:inline text-sm font-medium">Import</span>
              </button>

              <button
                onClick={handleExport}
                title="Download current sheet as CSV"
                className="p-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-file-csv md:mr-2 text-lg"></i>
                <span className="hidden md:inline text-sm font-medium">CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsAdding(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                <span className="hidden sm:inline">Entry</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar / Selection */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Viewing Class:</span>
            <div className="flex space-x-1">
              {ALL_CLASSES.map(cls => {
                const count = students.filter(s => s.classLevel === cls).length;
                return (
                  <button
                    key={cls}
                    onClick={() => setActiveClass(cls)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border flex items-center space-x-2 ${
                      activeClass === cls 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>{cls}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeClass === cls ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="md:hidden flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <button 
              onClick={() => setView('sheet')}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${view === 'sheet' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              SHEET
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              CHART
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdding ? (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentForm 
              onAdd={handleAddOrUpdate} 
              onCancel={() => setIsAdding(false)} 
              editStudent={editingStudent || undefined}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {view === 'sheet' ? `Class ${activeClass} Result Sheet` : `Class ${activeClass} Analytics`}
                </h2>
                <p className="text-sm text-slate-500">
                  {classResults.length} records found for current session
                </p>
              </div>
            </div>

            {view === 'sheet' ? (
              <ResultTable 
                results={classResults} 
                classLevel={activeClass}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <Dashboard results={classResults} className={activeClass} />
            )}
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400 font-medium z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>System Active</span>
          </div>
          <div>EduRank Result Management v2.1.0</div>
          <div className="hidden sm:block">Local Database • Punjab School Education Board Standards</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
