import React, { useState, useEffect, useMemo } from 'react';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { Role } from '../types';

/**
 * SubjectEntryForm - RE-ENGINEERED SECURE REGISTRY
 * 
 * Rules:
 * 1. ADMIN: Full access (All classes, all subjects).
 * 2. CLASS_INCHARGE: 
 *    - Full access (All subjects) in their 'assignedClass'.
 *    - Access ONLY to specific subjects in OTHER classes (via 'teachingAssignments').
 * 3. SUBJECT_TEACHER: 
 *    - Access ONLY to specific subjects in specific classes (via 'teachingAssignments').
 * 4. Punjabi Marks: 65 (Term/Preboard), 75 (Final).
 */
const SubjectEntryForm: React.FC<any> = ({ 
  classLevel = '6', 
  students = [], 
  onSave, 
  onCancel,
  currentUser,
  examType: propExamType // Receive initial exam type from App state
}) => {

  // 1. Component State - Synchronized with parent if available
  const [selectedExam, setSelectedExam] = useState<string>(propExamType || 'Final Exam');
  
  // Use centralized subject definitions from constants to ensure consistency
  const subjects = useMemo(() => GET_SUBJECTS_FOR_CLASS(classLevel as any), [classLevel]);
  const [selectedSubKey, setSelectedSubKey] = useState<string>(subjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});

  /**
   * canEdit - STRICT PERMISSION HIERARCHY
   */
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const { role, assignedClass, teachingAssignments } = currentUser;

    // RULE: ADMIN has full access
    if (role === Role.ADMIN) return true;

    const isHomeClass = String(assignedClass) === String(classLevel);

    // RULE: CLASS_INCHARGE has full power in their own class
    if (role === Role.CLASS_INCHARGE && isHomeClass) return true;

    // RULE: For non-home classes OR for SUBJECT_TEACHERS, check specific assignments
    const assignments = Array.isArray(teachingAssignments) ? teachingAssignments : [];
    return assignments.some((a: any) => 
      String(a.classLevel) === String(classLevel) && 
      Array.isArray(a.subjects) && 
      a.subjects.some((s: string) => String(s).toLowerCase() === String(selectedSubKey).toLowerCase())
    );
  }, [currentUser, classLevel, selectedSubKey]);

  // Use the centralized rule from examRules.ts for both display and storage
  const currentMax = useMemo(() => getExamMaxMarks(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // CRITICAL FIX: Use the shared utility to avoid "final" vs "final exam" mismatch
  const storageKey = useMemo(() => getMarkKey(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // Sync state from Registry to Local Input fields
  useEffect(() => {
    const fresh: Record<string, string> = {};
    students.forEach((s: any) => {
      const val = s.marks?.[storageKey];
      fresh[s.id] = (val !== undefined && val !== null) ? String(val) : '';
    });
    setLocalMarks(fresh);
  }, [storageKey, students]);

  // Auto-reset subject if class schema changes
  useEffect(() => {
    if (!subjects.some(s => s.key === selectedSubKey)) {
      setSelectedSubKey(subjects[0]?.key || '');
    }
  }, [classLevel, subjects]);

  const handleInputChange = (id: string, val: string) => {
    if (!canEdit) return; 
    // Allow empty string or digits only
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    if (!canEdit) return alert("Security Error: Unauthorized access attempt.");

    // Validation against currentMax (including Punjabi 65/75 rules)
    const invalid = students.filter((s: any) => {
      const mark = parseInt(localMarks[s.id] || '0', 10);
      return mark > currentMax;
    });

    if (invalid.length > 0) {
      return alert(`Validation Error: Marks for some students exceed the maximum limit of ${currentMax}.`);
    }

    const updated = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    onSave(updated);
    alert("Marks successfully updated in the system registry.");
  };

  const handleDownloadAwardList = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Name', `Marks (Out of ${currentMax})` ];
    const rows = students.map((s: any) => [s.rollNo, s.name, localMarks[s.id] || '0']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AwardList_Class${classLevel}_${selectedSubKey}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER SECTION */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black">Marks Registry</h2>
              {!canEdit ? (
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-lock"></i> No Permission
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-user-shield"></i> Editing Access
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              {currentUser?.name} • {currentUser?.role?.replace('_', ' ')} • Class {classLevel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Select Exam</span>
              <select 
                value={selectedExam} 
                onChange={e => setSelectedExam(e.target.value)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                <option value="Bimonthly">Bimonthly</option>
                <option value="Term Exam">Term Exam</option>
                <option value="Preboard">Preboard</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Select Subject</span>
              <select 
                value={selectedSubKey} 
                onChange={e => setSelectedSubKey(e.target.value)} 
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none min-w-[150px] shadow-xl"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="bg-indigo-600 px-6 py-2 rounded-2xl shadow-xl text-center border border-indigo-400">
              <span className="text-[8px] font-black text-indigo-100 uppercase block">Max Marks</span>
              <span className="text-xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="max-h-[55vh] overflow-y-auto bg-slate-50/20">
        {!canEdit && (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
             <i className="fa-solid fa-lock text-amber-500"></i>
             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">
               Restricted Access: You are not authorized for Class {classLevel} - {selectedSubKey.toUpperCase()}.
             </span>
          </div>
        )}
        <table className="w-full text-left">
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
              <tr><td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black">No student records found in Class {classLevel}.</td></tr>
            ) : (
              students.map((s: any) => {
                const val = localMarks[s.id] || '';
                const isErr = parseInt(val, 10) > currentMax;
                return (
                  <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                    <td className="px-10 py-5 font-black text-slate-800">{s.name}</td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="text" value={val} readOnly={!canEdit} disabled={!canEdit}
                          onChange={e => handleInputChange(s.id, e.target.value)}
                          className={`w-32 p-4 text-center rounded-2xl font-black text-2xl border-2 transition-all outline-none ${
                            !canEdit ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' :
                            isErr ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 
                            'border-slate-100 bg-white text-slate-900 focus:border-indigo-600 shadow-sm'
                          }`}
                          placeholder={canEdit ? "-" : "---"}
                        />
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        val === '' ? 'bg-slate-100 text-slate-400 border-slate-200' : 
                        !canEdit ? 'bg-slate-50 text-slate-300 border-slate-100' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm'
                      }`}>
                        {val === '' ? 'Empty' : 'Entered'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER SECTION */}
      <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all ${canEdit ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>
            <i className={`fa-solid ${canEdit ? 'fa-pen-to-square' : 'fa-lock-open'}`}></i>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Entry Verification</span>
            <span className="text-sm font-black text-slate-800">{students.length} Records Loaded</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button onClick={onCancel} className="px-6 py-5 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Close Portal</button>
          <button onClick={handleDownloadAwardList} className="px-8 py-5 bg-emerald-600 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2">
            <i className="fa-solid fa-file-csv"></i> Download List
          </button>
          <button 
            onClick={handleCommit} 
            disabled={!canEdit} 
            className={`px-12 py-5 rounded-[24px] text-[11px] font-black uppercase shadow-2xl transition-all ${
              canEdit ? 'bg-slate-950 text-white hover:bg-indigo-600 hover:-translate-y-1' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
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
