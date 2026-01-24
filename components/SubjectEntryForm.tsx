import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - Hardened Registry Portal
 * Designed to handle dynamic schemas for Middle (6-8) and High (9-10) schools.
 * Corrects white-screen issues by using defensive initialization.
 */
const SubjectEntryForm = ({ 
  classLevel = '6', 
  onClassChange, 
  students = [], 
  onSave, 
  onCancel, 
  examType = 'Final Exam', 
  onExamTypeChange,
  currentUser 
}: any) => {

  // 1. Internal Constants & Rules (No external dependencies to avoid import crashes)
  const EXAM_TYPES = ['Bimonthly', 'Term Exam', 'Preboard', 'Final Exam'];
  
  const getSubjectsForClass = (cls: any) => {
    const clsStr = String(cls || '6');
    const isMiddle = ['6', '7', '8'].includes(clsStr);
    
    if (isMiddle) {
      return [
        { key: 'pbi', label: 'Punjabi' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'eng', label: 'English' },
        { key: 'math', label: 'Math' },
        { key: 'sci', label: 'Science' },
        { key: 'sst', label: 'SST' },
        { key: 'comp', label: 'Computer' },
        { key: 'phy_edu', label: 'Phy Edu' },
        { key: 'agri', label: 'Agri' }
      ];
    } else {
      return [
        { key: 'pbi_a', label: 'Punjabi A' },
        { key: 'pbi_b', label: 'Punjabi B' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'eng', label: 'English' },
        { key: 'math', label: 'Math' },
        { key: 'sci', label: 'Science' },
        { key: 'sst', label: 'SST' },
        { key: 'comp', label: 'Computer' },
        { key: 'phy_edu', label: 'Phy Edu' }
      ];
    }
  };

  const getRuleMaxMarks = (type: string, sub: string) => {
    const t = String(type || '');
    const s = String(sub || '');
    if (t === 'Bimonthly') return 20;
    if (t === 'Term Exam' || t === 'Preboard') return 80;
    if (t === 'Final Exam') {
      if (s === 'pbi_a' || s === 'pbi_b') return 75;
      return 100;
    }
    return 100;
  };

  // 2. State & Memoization
  const availableSubjects = useMemo(() => getSubjectsForClass(classLevel), [classLevel]);
  
  // Use a unique key for the component state based on classLevel to force clean transitions
  const [selectedSub, setSelectedSub] = useState(() => availableSubjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<any>({});
  const [status, setStatus] = useState<any>({});

  // 3. Effect: Sync state when class or subjects change
  useEffect(() => {
    // Reset selection if the currently selected subject isn't in the new class schema
    const exists = availableSubjects.find((s: any) => s.key === selectedSub);
    if (!exists && availableSubjects.length > 0) {
      setSelectedSub(availableSubjects[0].key);
    }
  }, [availableSubjects, selectedSub]);

  // Derived values for storage
  const safeExamType = String(examType || 'Final Exam');
  const safeSubKey = String(selectedSub || '');
  const currentMax = getRuleMaxMarks(safeExamType, safeSubKey);
  const storageKey = `${safeExamType.toLowerCase()}_${safeSubKey.toLowerCase()}`;

  // 4. Effect: Sync data from props into local editable state
  useEffect(() => {
    const freshMarks: any = {};
    const freshStatus: any = {};
    const list = Array.isArray(students) ? students : [];
    
    list.forEach((s: any) => {
      if (s && s.id) {
        const val = s.marks && s.marks[storageKey];
        freshMarks[s.id] = (val !== undefined && val !== null) ? String(val) : '';
        freshStatus[s.id] = 'Stored';
      }
    });
    setLocalMarks(freshMarks);
    setStatus(freshStatus);
  }, [storageKey, students]);

  // 5. Handlers
  const handleInputChange = (sid: string, val: string) => {
    if (!sid) return;
    // Allow only numbers
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks((prev: any) => ({ ...prev, [sid]: val }));
    setStatus((prev: any) => ({ ...prev, [sid]: 'Pending' }));
  };

  const handleCommitChanges = () => {
    if (currentUser?.role === 'STUDENT') return;

    const list = Array.isArray(students) ? students : [];
    const invalidCount = Object.entries(localMarks).filter(([id, val]: any) => {
      const num = parseInt(val || '0', 10);
      return num > currentMax;
    }).length;

    if (invalidCount > 0) {
      alert(`⚠️ Correction Required: ${invalidCount} entries exceed Max Marks (${currentMax}).`);
      return;
    }

    const updatedData = list.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id], 10)
      }
    }));

    if (onSave) {
      onSave(updatedData);
      const savedStatus: any = {};
      list.forEach((s: any) => { if (s && s.id) savedStatus[s.id] = 'Stored'; });
      setStatus(savedStatus);
      alert(`✅ Data synchronization complete for ${safeExamType} ${safeSubKey.toUpperCase()}.`);
    }
  };

  const isSelectorDisabled = currentUser?.role === 'CLASS_INCHARGE';

  // Defensive Render Check
  if (!availableSubjects || availableSubjects.length === 0) {
    return (
      <div className="p-20 text-center bg-white rounded-[40px] shadow-xl">
        <i className="fa-solid fa-circle-exclamation text-red-500 text-5xl mb-4"></i>
        <p className="font-black text-slate-800">Subject Schema Error</p>
        <button onClick={onCancel} className="mt-4 px-6 py-2 bg-slate-100 rounded-xl font-bold">Return</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* PORTAL HEADER */}
      <div className="p-8 bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
              <i className="fa-solid fa-server text-3xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none">Entry Portal</h2>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-90">
                Registry Active • {currentUser?.name || 'Academic Staff'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Class</span>
              <select 
                disabled={isSelectorDisabled}
                value={classLevel} 
                onChange={(e) => onClassChange && onClassChange(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Session</span>
              <select 
                value={safeExamType} 
                onChange={(e) => onExamTypeChange && onExamTypeChange(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSub} 
                onChange={(e) => setSelectedSub(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                {availableSubjects.map((s: any) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-indigo-500/20 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-white/60">Max Marks</span>
              <span className="text-2xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6 border-b border-slate-100">Roll No</th>
              <th className="px-10 py-6 border-b border-slate-100">Student Identity</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Marks Input</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!students || students.length === 0) ? (
              <tr>
                <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">
                  No records found for Class {classLevel}
                </td>
              </tr>
            ) : (
              students.map((s: any, idx: number) => {
                if (!s || !s.id) return null;
                const score = localMarks[s.id] || '';
                const isViolation = parseInt(score, 10) > currentMax;
                const isPending = status[s.id] === 'Pending';

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
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">Class Record Match</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <div className="relative w-40">
                          <input 
                            type="text"
                            value={score}
                            onChange={(e) => handleInputChange(s.id, e.target.value)}
                            className={`w-full p-4 text-center rounded-2xl font-black text-2xl shadow-inner border-2 transition-all outline-none ${
                              isViolation ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 bg-white text-slate-900 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isViolation && <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-xl border-2 border-white font-black">!</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          isPending ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {isPending ? 'Syncing...' : 'Committed'}
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
             <i className="fa-solid fa-cloud-bolt"></i>
           </div>
           <div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Session Data</span>
             <span className="text-sm font-black text-slate-800">{(students || []).length} Records Processed</span>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors"
          >
            Cancel Session
          </button>
          <button 
            onClick={handleCommitChanges}
            className="flex-1 sm:flex-none px-16 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-slate-950 hover:-translate-y-1 transition-all"
          >
            Commit to Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
