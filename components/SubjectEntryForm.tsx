import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - FINAL SECURE VERSION
 * Optimized for exact school board rules and strict role-based access control.
 */
const SubjectEntryForm: React.FC<any> = ({ 
  classLevel = '6', 
  students = [], 
  onSave, 
  onCancel,
  currentUser 
}) => {

  // 1. Local Configuration & State
  const [selectedExam, setSelectedExam] = useState<string>('Final Exam');
  
  /**
   * getSubjects - Dynamic schema based on Middle (6-8) vs High (9-10)
   */
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
   * canEdit - EXACT Permission Logic
   * ADMIN: Always true.
   * CLASS_INCHARGE: Always true IF classLevel matches assignedClass (Flexibility for all subjects).
   * SUBJECT_TEACHER: True ONLY IF class matches AND subject is in their teachingAssignments.
   */
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const { role, assignedClass, teachingAssignments } = currentUser;

    // 1. ADMIN
    if (role === 'ADMIN') return true;

    // 2. CLASS_INCHARGE (Refined Flexibility)
    if (role === 'CLASS_INCHARGE') {
      return String(assignedClass) === String(classLevel);
    }

    // 3. SUBJECT_TEACHER (Strict Assignment Check)
    if (role === 'SUBJECT_TEACHER') {
      const assignments = Array.isArray(teachingAssignments) ? teachingAssignments : [];
      return assignments.some((a: any) => 
        String(a.classLevel) === String(classLevel) && 
        a.subjects.includes(selectedSubKey)
      );
    }

    return false;
  }, [currentUser, classLevel, selectedSubKey]);

  /**
   * getMaxMarks - PUNJABI MARKS RULE (65/75/20)
   */
  const getMaxMarks = (exam: string, subKey: string) => {
    const lowerKey = subKey.toLowerCase();
    const isPbiAB = lowerKey === 'pbi_a' || lowerKey === 'pbi_b' || lowerKey === 'pbi' || lowerKey.includes('punjabi');

    if (exam === 'Bimonthly') return 20;

    if (exam === 'Term Exam' || exam === 'Preboard') {
      if (isPbiAB) return 65; // New Rule: 65 for Pbi
      return 80;
    }

    if (exam === 'Final Exam') {
      if (isPbiAB) return 75; // Rule: 75 for Pbi
      return 100;
    }

    return 100;
  };

  const currentMax = useMemo(() => getMaxMarks(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // Sync Logic
  const generateStorageKey = (exam: string, sub: string) => {
    const prefix = exam.toLowerCase().split(' ')[0];
    return `${prefix}_${sub.toLowerCase()}`;
  };

  const storageKey = useMemo(() => generateStorageKey(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  useEffect(() => {
    const freshMarks: Record<string, string> = {};
    students.forEach((s: any) => {
      const savedVal = s.marks?.[storageKey];
      freshMarks[s.id] = (savedVal !== undefined && savedVal !== null) ? String(savedVal) : '';
    });
    setLocalMarks(freshMarks);
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
    if (!canEdit) return alert("Unauthorized access attempt.");

    const violations = students.filter((s: any) => parseInt(localMarks[s.id] || '0', 10) > currentMax);
    if (violations.length > 0) return alert(`Marks exceed maximum limit of ${currentMax}.`);

    const updatedStudents = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    onSave(updatedStudents);
    alert("Data saved to registry.");
  };

  const handleDownloadAwardList = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Name', 'Marks'];
    const rows = students.map((s: any) => [s.rollNo, s.name, localMarks[s.id] || '0']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AwardList_${classLevel}_${selectedSubKey}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black">Entry Portal</h2>
              {!canEdit && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-lock"></i> Locked
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Class {classLevel} • {currentUser?.name || 'Administrator'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Exam</span>
              <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none">
                <option value="Bimonthly">Bimonthly</option>
                <option value="Term Exam">Term Exam</option>
                <option value="Preboard">Preboard</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Subject</span>
              <select value={selectedSubKey} onChange={e => setSelectedSubKey(e.target.value)} className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black outline-none min-w-[150px]">
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="bg-indigo-500/30 px-6 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[8px] font-black text-indigo-200 uppercase block">Max</span>
              <span className="text-xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-h-[50vh] overflow-y-auto">
        {!canEdit && (
          <div className="bg-amber-50 p-3 text-center border-b border-amber-100 flex items-center justify-center gap-2">
             <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xs"></i>
             <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Read-Only: Authorization required for this Class/Subject combination.</span>
          </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm border-b">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <th className="px-10 py-6">Roll</th>
              <th className="px-10 py-6">Student</th>
              <th className="px-10 py-6 text-center">Marks</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s: any) => {
              const val = localMarks[s.id] || '';
              const isErr = parseInt(val, 10) > currentMax;
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-4 font-black text-slate-400">{s.rollNo}</td>
                  <td className="px-10 py-4 font-black text-slate-800">{s.name}</td>
                  <td className="px-10 py-4">
                    <div className="flex justify-center">
                      <input 
                        type="text" value={val} readOnly={!canEdit} disabled={!canEdit}
                        onChange={e => handleInputChange(s.id, e.target.value)}
                        className={`w-24 p-3 text-center rounded-2xl font-black text-xl border-2 transition-all outline-none ${
                          !canEdit ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' :
                          isErr ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-white text-slate-900 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-4 text-center">
                    <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      val === '' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {val === '' ? 'Empty' : 'Entered'}
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
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canEdit ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
            <i className={`fa-solid ${canEdit ? 'fa-pen-to-square' : 'fa-lock'}`}></i>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Entry Status</span>
            <span className="text-xs font-black text-slate-800">{students.length} Records Loaded</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Cancel</button>
          <button onClick={handleDownloadAwardList} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
            <i className="fa-solid fa-download"></i> Award List
          </button>
          <button onClick={handleCommit} disabled={!canEdit} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${
            canEdit ? 'bg-indigo-600 text-white hover:bg-slate-900' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}>Save Registry</button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
