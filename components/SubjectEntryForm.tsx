import React, { useState, useEffect, useMemo } from 'react';
import { getExamMaxMarks } from '../utils/examRules';

/**
 * SubjectEntryForm - SECURE REGISTRY
 * 
 * Permissions:
 * 1. ADMIN: All classes, all subjects.
 * 2. CLASS_INCHARGE: 
 *    - All subjects in 'assignedClass'.
 *    - Specific subjects in other classes (via 'teachingAssignments').
 * 3. SUBJECT_TEACHER: 
 *    - ONLY specific subjects in specific classes (via 'teachingAssignments').
 */
const SubjectEntryForm: React.FC<any> = ({ 
  classLevel = '6', 
  students = [], 
  onSave, 
  onCancel,
  currentUser 
}) => {

  const [selectedExam, setSelectedExam] = useState<string>('Final Exam');
  
  const getSubjects = (cls: string) => {
    const isMiddle = ['6', '7', '8'].includes(cls);
    if (isMiddle) {
      return [
        { key: 'math', label: 'Mathematics' },
        { key: 'sci', label: 'Science' },
        { key: 'eng', label: 'English' },
        { key: 'sst', label: 'Social Studies' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'pbi', label: 'Punjabi' },
        { key: 'comp', label: 'Computer Science' },
        { key: 'phy_edu', label: 'Physical Education' },
        { key: 'agri', label: 'Agriculture' },
      ];
    }
    return [
      { key: 'math', label: 'Mathematics' },
      { key: 'sci', label: 'Science' },
      { key: 'eng', label: 'English' },
      { key: 'sst', label: 'Social Studies' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'pbi_a', label: 'Punjabi A' },
      { key: 'pbi_b', label: 'Punjabi B' },
      { key: 'comp', label: 'Computer Science' },
      { key: 'phy_edu', label: 'Physical Education' },
    ];
  };

  const subjects = useMemo(() => getSubjects(classLevel), [classLevel]);
  const [selectedSubKey, setSelectedSubKey] = useState<string>(subjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});

  /**
   * canEdit - Strict Permission Check
   */
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const { role, assignedClass, teachingAssignments } = currentUser;

    // 1. ADMIN - God Mode
    if (role === 'ADMIN') return true;

    const isTargetingHomeClass = String(assignedClass) === String(classLevel);

    // 2. CLASS_INCHARGE - Home Class Full Power
    if (role === 'CLASS_INCHARGE' && isTargetingHomeClass) return true;

    // 3. Assignment Check (For Teachers and Incharges in non-home classes)
    const assignments = Array.isArray(teachingAssignments) ? teachingAssignments : [];
    return assignments.some((a: any) => 
      String(a.classLevel) === String(classLevel) && 
      Array.isArray(a.subjects) && 
      a.subjects.includes(selectedSubKey)
    );
  }, [currentUser, classLevel, selectedSubKey]);

  // Use the centralized rule from examRules.ts
  const currentMax = useMemo(() => getExamMaxMarks(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  const storageKey = useMemo(() => {
    const prefix = selectedExam.toLowerCase().split(' ')[0];
    return `${prefix}_${selectedSubKey.toLowerCase()}`;
  }, [selectedExam, selectedSubKey]);

  useEffect(() => {
    const fresh: Record<string, string> = {};
    students.forEach((s: any) => {
      const val = s.marks?.[storageKey];
      fresh[s.id] = (val !== undefined && val !== null) ? String(val) : '';
    });
    setLocalMarks(fresh);
  }, [storageKey, students]);

  useEffect(() => {
    if (!subjects.some(s => s.key === selectedSubKey)) {
      setSelectedSubKey(subjects[0]?.key || '');
    }
  }, [classLevel, subjects]);

  const handleInputChange = (id: string, val: string) => {
    if (!canEdit) return; 
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    if (!canEdit) return alert("Unauthorized access denied.");

    const invalid = students.filter((s: any) => parseInt(localMarks[s.id] || '0', 10) > currentMax);
    if (invalid.length > 0) return alert(`Input Error: Marks cannot exceed maximum limit (${currentMax}).`);

    const updated = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    onSave(updated);
    alert("Data successfully committed to the database.");
  };

  const handleDownloadAwardList = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Name', 'Obtained Marks', 'Max Marks'];
    const rows = students.map((s: any) => [s.rollNo, s.name, localMarks[s.id] || '0', currentMax]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AwardList_${classLevel}_${selectedSubKey}_${selectedExam.replace(/\s/g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black">Subject Portal</h2>
              {!canEdit ? (
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-lock"></i> Locked
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-pen"></i> Authorized
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Auth: {currentUser?.name} ({currentUser?.role}) • Class {classLevel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Exam Cycle</span>
              <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none shadow-xl">
                <option value="Bimonthly">Bimonthly</option>
                <option value="Term Exam">Term Exam</option>
                <option value="Preboard">Preboard</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Subject</span>
              <select value={selectedSubKey} onChange={e => setSelectedSubKey(e.target.value)} className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none min-w-[150px] shadow-xl">
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="bg-indigo-600 px-6 py-2 rounded-2xl shadow-xl text-center border border-indigo-400">
              <span className="text-[8px] font-black text-indigo-100 uppercase block">Limit</span>
              <span className="text-xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-h-[55vh] overflow-y-auto">
        {!canEdit && (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
             <i className="fa-solid fa-circle-exclamation text-amber-500"></i>
             <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic">
               You are not the incharge or assigned teacher for this class/subject.
             </span>
          </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-white sticky top-0 z-20 shadow-sm border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Roll No</th>
              <th className="px-10 py-6">Student Name</th>
              <th className="px-10 py-6 text-center">Marks Input</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-slate-50/20">
            {students.map((s: any) => {
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
                          !canEdit ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' :
                          isErr ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-600 shadow-sm'
                        }`}
                        placeholder={canEdit ? "-" : "LKD"}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-5 text-center">
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      val === '' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm'
                    }`}>
                      {val === '' ? 'Pending' : 'Done'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${canEdit ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-400'}`}>
            <i className={`fa-solid ${canEdit ? 'fa-unlock' : 'fa-lock'}`}></i>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Entry Access</span>
            <span className="text-sm font-black text-slate-800">{students.length} Students Total</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button onClick={onCancel} className="px-6 py-4 text-[11px] font-black uppercase text-slate-400">Back</button>
          <button onClick={handleDownloadAwardList} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
            <i className="fa-solid fa-download"></i> Award List
          </button>
          <button onClick={handleCommit} disabled={!canEdit} className={`px-12 py-4 rounded-2xl text-[11px] font-black uppercase shadow-2xl transition-all ${
            canEdit ? 'bg-indigo-600 text-white hover:bg-slate-900' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          }`}>Save Registry</button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
