import React, { useState, useEffect, useMemo } from 'react';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';
import { GET_SUBJECTS_FOR_CLASS, ALL_CLASSES } from '../constants';
import { Role, ExamType, ClassLevel } from '../types';

interface SubjectEntryFormProps {
  classLevel: ClassLevel;
  students: any[];
  onSave: (students: any[]) => void;
  onCancel: () => void;
  currentUser: any;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
  onClassChange: (cls: ClassLevel) => void;
}

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ 
  classLevel, 
  students = [], 
  onSave, 
  onCancel,
  currentUser,
  examType,
  onExamTypeChange,
  onClassChange
}) => {
  const subjects = useMemo(() => GET_SUBJECTS_FOR_CLASS(classLevel), [classLevel]);
  
  // Initialize with the first subject key available for the class
  const [selectedSubKey, setSelectedSubKey] = useState<string>(() => subjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});

  // Fix: Sync selectedSubKey whenever classLevel changes.
  // This ensures selectedSubKey is always a valid key for the current class schema.
  useEffect(() => {
    if (subjects.length > 0) {
      const existsInCurrentClass = subjects.some(s => s.key === selectedSubKey);
      if (!existsInCurrentClass) {
        setSelectedSubKey(subjects[0].key);
      }
    }
  }, [subjects, classLevel, selectedSubKey]);

  // Derive editing permissions
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const { role, assignedClass, teachingAssignments } = currentUser;
    
    if (role === Role.ADMIN) return true;
    if (role === Role.CLASS_INCHARGE && String(assignedClass) === String(classLevel)) return true;

    const assignments = Array.isArray(teachingAssignments) ? teachingAssignments : [];
    return assignments.some((a: any) => 
      String(a.classLevel) === String(classLevel) && 
      Array.isArray(a.subjects) && 
      a.subjects.some((s: string) => String(s).toLowerCase() === String(selectedSubKey).toLowerCase())
    );
  }, [currentUser, classLevel, selectedSubKey]);

  // Get marks limit based on refined Punjabi logic in examRules.ts
  const currentMax = useMemo(() => {
    if (!selectedSubKey) return 100;
    const sub = subjects.find(s => s.key === selectedSubKey);
    return getExamMaxMarks(examType, sub || selectedSubKey);
  }, [examType, selectedSubKey, subjects]);

  const storageKey = useMemo(() => getMarkKey(examType, selectedSubKey), [examType, selectedSubKey]);

  // Load marks from students props whenever storageKey or students array changes
  useEffect(() => {
    if (!storageKey || storageKey === 'unassigned_marks_registry') return;
    const fresh: Record<string, string> = {};
    const studentList = Array.isArray(students) ? students : [];
    studentList.forEach((s: any) => {
      if (s && s.id) {
        const val = s.marks?.[storageKey];
        fresh[s.id] = (val !== undefined && val !== null) ? String(val) : '';
      }
    });
    setLocalMarks(fresh);
  }, [storageKey, students]);

  const handleInputChange = (id: string, val: string) => {
    if (!canEdit) return; 
    // Accept only positive integers or empty string
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    if (!canEdit) {
      alert("Permission Error: You are not authorized to modify this registry.");
      return;
    }
    
    // Strict validation check before saving
    const studentList = Array.isArray(students) ? students : [];
    const invalidEntries = studentList.filter((s: any) => {
      const markValue = parseInt(localMarks[s.id] || '0', 10);
      return markValue > currentMax;
    });

    if (invalidEntries.length > 0) {
      alert(`Validation Error: ${invalidEntries.length} entries exceed the maximum allowed limit of ${currentMax} marks.`);
      return;
    }

    const updatedStudents = studentList.map((s: any) => ({
      ...s,
      marks: { 
        ...(s.marks || {}), 
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10) 
      }
    }));

    onSave(updatedStudents);
    alert("Success: Marks have been saved and synchronized.");
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER SECTION */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">Entry Portal</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                canEdit ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'
              }`}>
                <i className={`fa-solid ${canEdit ? 'fa-pen-nib' : 'fa-lock'}`}></i>
                {canEdit ? 'Edit Access' : 'Read Only'}
              </span>
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Class {classLevel} Registry • Exam: {examType}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            {/* Global Context Switchers */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Class</span>
              <select 
                value={classLevel} 
                onChange={e => onClassChange(e.target.value as ClassLevel)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none shadow-xl cursor-pointer"
              >
                {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Exam Type</span>
              <select 
                value={examType} 
                onChange={e => onExamTypeChange(e.target.value as ExamType)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none shadow-xl cursor-pointer"
              >
                {Object.values(ExamType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Subject</span>
              <select 
                value={selectedSubKey} 
                onChange={e => setSelectedSubKey(e.target.value)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none min-w-[150px] shadow-xl cursor-pointer"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            
            <div className="bg-indigo-600 px-6 py-2 rounded-2xl shadow-xl text-center border border-indigo-400 min-w-[80px]">
              <span className="text-[8px] font-black text-indigo-100 uppercase block">Max Marks</span>
              <span className="text-xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MARKS GRID AREA */}
      <div className="max-h-[55vh] overflow-y-auto bg-slate-50/20">
        {!canEdit && (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
             <i className="fa-solid fa-lock text-amber-500"></i>
             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">
               Locked: You don't have teaching or incharge assignments for Class {classLevel} {selectedSubKey.toUpperCase()}.
             </span>
          </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-white sticky top-0 z-20 shadow-sm border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Roll No</th>
              <th className="px-10 py-6">Student Name</th>
              <th className="px-10 py-6 text-center">Marks</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr><td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black italic">No student records initialized for Class {classLevel}.</td></tr>
            ) : (
              students.map((s: any) => {
                const mark = localMarks[s.id] || '';
                const isTooHigh = parseInt(mark, 10) > currentMax;
                return (
                  <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                    <td className="px-10 py-5 font-black text-slate-800">{s.name}</td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="text" value={mark} readOnly={!canEdit} disabled={!canEdit}
                          onChange={e => handleInputChange(s.id, e.target.value)}
                          className={`w-32 p-4 text-center rounded-2xl font-black text-2xl border-2 transition-all outline-none ${
                            !canEdit ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' :
                            isTooHigh ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 
                            'border-slate-100 bg-white text-slate-900 focus:border-indigo-600 shadow-sm'
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                       <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${
                         mark === '' ? 'bg-slate-50 text-slate-300 border-slate-100' :
                         isTooHigh ? 'bg-red-50 text-red-500 border-red-100' :
                         'bg-emerald-50 text-emerald-600 border-emerald-100'
                       }`}>
                         {mark === '' ? 'Missing' : isTooHigh ? 'Invalid' : 'Success'}
                       </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
           Loaded: {students.length} Student Profiles
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button onClick={onCancel} className="flex-1 sm:flex-none px-6 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Close Portal</button>
          <button 
            onClick={handleCommit} 
            disabled={!canEdit} 
            className={`flex-1 sm:flex-none px-12 py-4 rounded-2xl text-[11px] font-black uppercase shadow-2xl transition-all ${
              canEdit ? 'bg-slate-950 text-white hover:bg-indigo-600 hover:-translate-y-1' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
