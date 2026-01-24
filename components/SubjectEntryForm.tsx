import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassLevel, User, Role, ExamType } from '../types';
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

  // 1. Load subjects for current class schema
  const availableSubjects = useMemo(() => {
    try {
      return GET_SUBJECTS_FOR_CLASS(classLevel) || [];
    } catch (e) {
      return [];
    }
  }, [classLevel]);

  // 2. Initialize subject selection safely
  const [selectedSubKey, setSelectedSubKey] = useState<string>('');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'Stored' | 'Pending'>>({});

  // 3. EFFECT: Safe Subject Synchronization
  // This is the critical fix for White Screens. It ensures a valid subject is always selected.
  useEffect(() => {
    if (!availableSubjects || availableSubjects.length === 0) return;
    
    // If current selection is invalid for this class, reset to the first subject
    const isValid = availableSubjects.some(s => String(s.key) === selectedSubKey);
    if (!isValid) {
      setSelectedSubKey(String(availableSubjects[0].key));
    }
  }, [availableSubjects, selectedSubKey]);

  // 4. Derived Schema values (Highly defensive)
  const currentSubjectConfig = useMemo(() => {
    return availableSubjects.find(s => String(s.key) === selectedSubKey);
  }, [availableSubjects, selectedSubKey]);

  const currentMax = useMemo(() => {
    return currentSubjectConfig ? getExamMaxMarks(examType, currentSubjectConfig) : 100;
  }, [examType, currentSubjectConfig]);

  const storageKey = useMemo(() => {
    return getMarkKey(examType, selectedSubKey);
  }, [examType, selectedSubKey]);

  // 5. EFFECT: Data hydration for the table
  useEffect(() => {
    if (!storageKey || storageKey === 'unknown_key') return;
    
    const marks: Record<string, string> = {};
    const statuses: Record<string, 'Stored' | 'Pending'> = {};
    
    students.forEach(s => {
      if (s && s.id) {
        const val = s.marks?.[storageKey];
        marks[s.id] = (val !== undefined && val !== null) ? String(val) : '';
        statuses[s.id] = 'Stored';
      }
    });
    
    setLocalMarks(marks);
    setSaveStatus(statuses);
  }, [storageKey, students]);

  // 6. Interaction Handlers
  const handleInputChange = (studentId: string, value: string) => {
    if (!studentId) return;
    if (value !== '' && !/^\d+$/.test(value)) return;
    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    setSaveStatus(prev => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleCommit = () => {
    if (!currentUser || currentUser.role === Role.STUDENT) return;

    // Validate marks
    const violations = students.filter(s => {
      const val = parseInt(localMarks[s.id] || '0', 10);
      return val > currentMax;
    });

    if (violations.length > 0) {
      alert(`⚠️ Validation Error: Some entries exceed the maximum allowed marks (${currentMax}).`);
      return;
    }

    const updatedStudents = students.map(s => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    onSave(updatedStudents);
    alert(`✅ ${currentSubjectConfig?.label || 'Subject'} marks synced successfully.`);
    
    // Set all to stored
    const resetStatus: Record<string, 'Stored' | 'Pending'> = {};
    students.forEach(s => resetStatus[s.id] = 'Stored');
    setSaveStatus(resetStatus);
  };

  if (!availableSubjects || availableSubjects.length === 0) {
    return <div className="p-20 text-center bg-white rounded-3xl shadow-xl">Loading Registry...</div>;
  }

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
              <i className="fa-solid fa-database text-3xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black">Registry Portal</h2>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Staff Authorization Level 1</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 rounded-[32px] border border-white/5 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Class</span>
              <select 
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value as ClassLevel)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Exam</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {Object.values(ExamType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSubKey} 
                onChange={(e) => setSelectedSubKey(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {availableSubjects.map(s => <option key={String(s.key)} value={String(s.key)}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-indigo-500/30 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-200">Max</span>
              <span className="text-2xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6 border-b">Roll No</th>
              <th className="px-10 py-6 border-b">Name</th>
              <th className="px-10 py-6 border-b text-center">Marks Input</th>
              <th className="px-10 py-6 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s, idx) => (
              <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/50 transition-all`}>
                <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                <td className="px-10 py-5 font-black text-slate-800">{s.name}</td>
                <td className="px-10 py-5">
                  <div className="flex justify-center">
                    <input 
                      type="text"
                      value={localMarks[s.id] || ''}
                      onChange={(e) => handleInputChange(s.id, e.target.value)}
                      className="w-40 p-4 text-center rounded-2xl font-black text-2xl shadow-inner border-2 border-slate-100 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </td>
                <td className="px-10 py-5">
                  <div className="flex justify-center">
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      saveStatus[s.id] === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {saveStatus[s.id] === 'Pending' ? 'Modified' : 'Synced'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl"><i className="fa-solid fa-cloud-arrow-up"></i></div>
           <span className="text-sm font-black text-slate-800">{students.length} Records Loaded</span>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={onCancel} className="flex-1 px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
          <button onClick={handleCommit} className="flex-1 px-16 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-950 transition-all">Commit Sync</button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
