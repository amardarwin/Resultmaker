import React, { useState, useEffect, useMemo } from 'react';
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

const SubjectEntryForm: React.FC<any> = ({ 
  classLevel, 
  students = [], 
  onSave, 
  onCancel,
  currentUser,
  examType,
  onExamTypeChange,
  onClassChange
}) => {
  // 1. Get subjects for current class schema
  const subjects = useMemo(() => GET_SUBJECTS_FOR_CLASS(classLevel), [classLevel]);
  
  // 2. Local state for selection and data entry
  const [selectedSubKey, setSelectedSubKey] = useState<string>(() => subjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});

  // 3. INTERNAL MARKS LOGIC (Requirement 2)
  const maxMarks = useMemo(() => {
    const type = String(examType).toLowerCase();
    const isPbiSpecial = selectedSubKey === 'pbi_a' || selectedSubKey === 'pbi_b';

    if (type.includes('bimonthly')) {
      return 20;
    }
    
    if (type.includes('term') || type.includes('preboard')) {
      return isPbiSpecial ? 65 : 80;
    }
    
    if (type.includes('final')) {
      return isPbiSpecial ? 75 : 100;
    }
    
    return 100; // Default fallback
  }, [examType, selectedSubKey]);

  // 4. HYBRID PERMISSIONS (Requirement 1: "Double Power" Fix)
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    
    // Logic A: Is Admin?
    const isAdmin = currentUser.role === Role.ADMIN;
    
    // Logic B: Is Owner of Class? (Incharge in their own class)
    const isClassIncharge = currentUser.role === Role.CLASS_INCHARGE && String(currentUser.assignedClass) === String(classLevel);
    
    // Logic C: Teaches This Subject? (Check all teaching assignments)
    const teachingAssignments = currentUser.teachingAssignments || [];
    const teachesSubject = teachingAssignments.some((a: any) => 
      Array.isArray(a.subjects) && a.subjects.some((s: string) => String(s).toLowerCase() === String(selectedSubKey).toLowerCase())
    );

    // FINAL PERMISSION RULE
    return isAdmin || isClassIncharge || teachesSubject;
  }, [currentUser, classLevel, selectedSubKey]);

  // Storage Key Logic (Internalized getMarkKey)
  const storageKey = useMemo(() => {
    const type = String(examType || '').toLowerCase().trim();
    const sub = String(selectedSubKey || '').toLowerCase().trim();
    return `${type}_${sub}`;
  }, [examType, selectedSubKey]);

  // Sync selectedSubKey when classLevel changes
  useEffect(() => {
    const currentSubjects = GET_SUBJECTS_FOR_CLASS(classLevel);
    const stillExists = currentSubjects.some(s => s.key === selectedSubKey);
    if (!stillExists && currentSubjects.length > 0) {
      setSelectedSubKey(currentSubjects[0].key);
    }
  }, [classLevel, selectedSubKey]);

  // Load existing marks into local editor state
  useEffect(() => {
    const fresh: Record<string, string> = {};
    students.forEach((s: any) => {
      const val = s.marks?.[storageKey];
      fresh[s.id] = (val !== undefined && val !== null) ? String(val) : '';
    });
    setLocalMarks(fresh);
  }, [storageKey, students]);

  const handleInputChange = (id: string, val: string) => {
    if (!canEdit) return; 
    if (val !== '' && !/^\d+$/.test(val)) return; // Numeric only
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    if (!canEdit) {
      alert("Access Denied: You do not have permission to edit this subject registry.");
      return;
    }
    
    // Final check for marks exceeding limit
    const invalidList = students.filter((s: any) => {
      const mark = parseInt(localMarks[s.id] || '0', 10);
      return mark > maxMarks;
    });

    if (invalidList.length > 0) {
      alert(`Entry Error: ${invalidList.length} marks exceed the maximum limit of ${maxMarks}.`);
      return;
    }

    const updatedStudents = students.map((s: any) => ({
      ...s,
      marks: { 
        ...(s.marks || {}), 
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10) 
      }
    }));

    onSave(updatedStudents);
    alert("Subject Registry synchronized and saved successfully.");
  };

  const downloadAwardList = () => {
    const subLabel = subjects.find(s => s.key === selectedSubKey)?.label || selectedSubKey;
    const headers = ['Roll No', 'Student Name', `Marks (Max: ${maxMarks})`];
    const rows = students.map(s => [s.rollNo, `"${s.name}"`, localMarks[s.id] || '0']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AwardList_Class${classLevel}_${subLabel}_${examType}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* COMMAND PORTAL HEADER */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">Subject Registry</h2>
              {!canEdit ? (
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-lock"></i> View Only
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-pen-nib"></i> Edit Authorized
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Session: {currentUser?.name || 'User'} • System Context: Class {classLevel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            {/* Class Switcher */}
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
            
            {/* Exam Switcher */}
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
            
            {/* Subject Switcher */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Subject Focus</span>
              <select 
                value={selectedSubKey} 
                onChange={e => setSelectedSubKey(e.target.value)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none min-w-[150px] shadow-xl cursor-pointer"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            
            <div className="bg-indigo-600 px-6 py-2 rounded-2xl shadow-xl text-center border border-indigo-400 min-w-[80px]">
              <span className="text-[8px] font-black text-indigo-100 uppercase block tracking-tighter">Max Marks</span>
              <span className="text-xl font-black text-white">{maxMarks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA ENTRY AREA */}
      <div className={`max-h-[55vh] overflow-y-auto transition-colors ${!canEdit ? 'bg-slate-100/50' : 'bg-slate-50/20'}`}>
        {!canEdit && (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
             <i className="fa-solid fa-shield-halved text-amber-500"></i>
             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">
               Access Restricted: You are not assigned as Incharge or Subject Teacher for this selection.
             </span>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-20 shadow-sm border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Roll No</th>
              <th className="px-10 py-6">Student Identity</th>
              <th className="px-10 py-6 text-center">Marks Input</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr><td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black italic">No student records found for Class {classLevel}.</td></tr>
            ) : (
              students.map((s: any) => {
                const markStr = localMarks[s.id] || '';
                const isOver = parseInt(markStr, 10) > maxMarks;
                return (
                  <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                    <td className="px-10 py-5 font-black text-slate-800">{s.name}</td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="text" 
                          value={markStr} 
                          readOnly={!canEdit} 
                          disabled={!canEdit}
                          onChange={e => handleInputChange(s.id, e.target.value)}
                          className={`w-32 p-4 text-center rounded-2xl font-black text-2xl border-2 transition-all outline-none ${
                            !canEdit ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' :
                            isOver ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 
                            'border-slate-100 bg-white text-slate-900 focus:border-indigo-600 shadow-sm group-hover:border-indigo-200'
                          }`}
                          placeholder="-"
                        />
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                       <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${
                         markStr === '' ? 'bg-slate-50 text-slate-300 border-slate-100' :
                         isOver ? 'bg-red-50 text-red-500 border-red-100' :
                         'bg-emerald-50 text-emerald-600 border-emerald-100'
                       }`}>
                         {markStr === '' ? 'Pending' : isOver ? 'Invalid' : 'Verified'}
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
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Loaded: {students.length} Student Profiles
          </div>
          <button 
            onClick={downloadAwardList}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-xl border border-emerald-200 hover:bg-emerald-200 transition-all"
          >
            <i className="fa-solid fa-file-csv"></i> Award List
          </button>
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <button onClick={onCancel} className="flex-1 sm:flex-none px-6 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Close Portal</button>
          <button 
            onClick={handleCommit} 
            disabled={!canEdit} 
            className={`flex-1 sm:flex-none px-12 py-4 rounded-2xl text-[11px] font-black uppercase shadow-2xl transition-all ${
              canEdit ? 'bg-slate-950 text-white hover:bg-indigo-600 hover:-translate-y-1 active:scale-95' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
