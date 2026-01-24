import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassLevel, User, Role, ExamType, StudentMarks } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';

interface SubjectEntryFormProps {
  classLevel: ClassLevel;
  onClassChange: (cls: ClassLevel) => void;
  students: Student[];
  onSave: (students: Student[]) => void;
  onCancel: () => void;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
  currentUser: User | null;
}

/**
 * SubjectEntryForm - High Performance Academic Registry
 * Handles dynamic subject schemas for Middle (6-8) and High (9-10) schools.
 */
const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ 
  classLevel, 
  onClassChange, 
  students = [], 
  onSave, 
  onCancel, 
  examType, 
  onExamTypeChange,
  currentUser 
}) => {

  // 1. Get Schema for Current Class
  const availableSubjects = useMemo(() => {
    try {
      return GET_SUBJECTS_FOR_CLASS(classLevel);
    } catch (e) {
      console.error("SubjectEntryForm: Failed to load subjects", e);
      return [];
    }
  }, [classLevel]);

  // 2. State Management
  const [selectedSubKey, setSelectedSubKey] = useState<string>(() => availableSubjects[0]?.key as string || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'Stored' | 'Pending'>>({});

  // 3. EFFECT: Handle Class Change (Self-Correction)
  // Ensures we don't try to enter marks for 'pbi_a' (High) in Class 6 (Middle)
  useEffect(() => {
    const isValid = availableSubjects.some(s => s.key === selectedSubKey);
    if (!isValid && availableSubjects.length > 0) {
      setSelectedSubKey(availableSubjects[0].key as string);
    }
  }, [availableSubjects, selectedSubKey]);

  // 4. Derived Values
  const currentSubjectConfig = availableSubjects.find(s => s.key === selectedSubKey);
  const currentMax = currentSubjectConfig ? getExamMaxMarks(examType, currentSubjectConfig) : 100;
  const storageKey = getMarkKey(examType, selectedSubKey);

  // 5. EFFECT: Synchronize Props to Local Edit State
  useEffect(() => {
    const marks: Record<string, string> = {};
    const statuses: Record<string, 'Stored' | 'Pending'> = {};
    
    students.forEach(s => {
      const val = s.marks[storageKey];
      marks[s.id] = (val !== undefined && val !== null) ? String(val) : '';
      statuses[s.id] = 'Stored';
    });
    
    setLocalMarks(marks);
    setSaveStatus(statuses);
  }, [storageKey, students]);

  // 6. Handlers
  const handleInputChange = (studentId: string, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    setSaveStatus(prev => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleCommit = () => {
    if (currentUser?.role === Role.STUDENT) return;

    // Validation: Check if any mark exceeds current maximum
    const violations = students.filter(s => {
      const val = parseInt(localMarks[s.id] || '0', 10);
      return val > currentMax;
    });

    if (violations.length > 0) {
      alert(`⚠️ Entry Denied: ${violations.length} students have marks exceeding the maximum (${currentMax}) for ${currentSubjectConfig?.label}.`);
      return;
    }

    const updatedStudents = students.map(s => ({
      ...s,
      marks: {
        ...s.marks,
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    onSave(updatedStudents);
    alert(`✅ Data synchronization successful for ${currentSubjectConfig?.label}.`);
    
    // Reset status to stored
    const resetStatus: Record<string, 'Stored' | 'Pending'> = {};
    students.forEach(s => resetStatus[s.id] = 'Stored');
    setSaveStatus(resetStatus);
  };

  const isClassLocked = currentUser?.role === Role.CLASS_INCHARGE;

  // Final Guard for White Screen
  if (!availableSubjects || availableSubjects.length === 0) {
    return (
      <div className="p-20 text-center bg-white rounded-[40px] shadow-xl border border-red-100">
        <i className="fa-solid fa-triangle-exclamation text-red-500 text-5xl mb-6"></i>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Registry Error</h3>
        <p className="text-slate-400 mt-2">Could not resolve subject schema for Class {classLevel}.</p>
        <button onClick={onCancel} className="mt-8 px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Return To Safety</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* PORTAL HEADER */}
      <div className="p-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
              <i className="fa-solid fa-database text-3xl text-indigo-300"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none">Registry Entry Portal</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-90">
                Staff Interface • {currentUser?.name || 'Administrator'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 rounded-[32px] border border-white/5 backdrop-blur-md">
            <div className="flex flex-col min-w-[100px]">
              <span className="text-[8px] font-black uppercase text-indigo-400 ml-1 mb-1">Class</span>
              <select 
                disabled={isClassLocked}
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value as ClassLevel)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl disabled:bg-slate-200 disabled:text-slate-500"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[140px]">
              <span className="text-[8px] font-black uppercase text-indigo-400 ml-1 mb-1">Exam Type</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {Object.values(ExamType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[130px]">
              <span className="text-[8px] font-black uppercase text-indigo-400 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSubKey} 
                onChange={(e) => setSelectedSubKey(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {availableSubjects.map(s => <option key={s.key as string} value={s.key as string}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-indigo-500/20 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-300">Max Marks</span>
              <span className="text-2xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA ENTRY GRID */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6 border-b border-slate-100">Roll No</th>
              <th className="px-10 py-6 border-b border-slate-100">Student Identity</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Marks Input (Numeric)</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Commit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">
                  No records found for Class {classLevel}
                </td>
              </tr>
            ) : (
              students.map((s, idx) => {
                const mark = localMarks[s.id] || '';
                const isViolation = parseInt(mark, 10) > currentMax;
                const status = saveStatus[s.id] || 'Stored';

                return (
                  <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/40 transition-all group`}>
                    <td className="px-10 py-5">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {s.rollNo}
                      </span>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{s.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">UID Match Active</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <div className="relative w-44">
                          <input 
                            type="text"
                            value={mark}
                            onChange={(e) => handleInputChange(s.id, e.target.value)}
                            className={`w-full p-4 text-center rounded-2xl font-black text-2xl shadow-inner border-2 transition-all outline-none ${
                              isViolation ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 bg-white text-slate-950 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isViolation && (
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-xl border-2 border-white font-black animate-bounce">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {status === 'Pending' ? 'Modified' : 'Synced'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-10 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl shadow-inner">
             <i className="fa-solid fa-cloud-arrow-up"></i>
           </div>
           <div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Session Metrics</span>
             <span className="text-sm font-black text-slate-800">{students.length} Records Loaded</span>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors"
          >
            Abort Session
          </button>
          <button 
            onClick={handleCommit}
            className="flex-1 sm:flex-none px-16 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-slate-950 hover:-translate-y-1 transition-all"
          >
            Commit to Local Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
