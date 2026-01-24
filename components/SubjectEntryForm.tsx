import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - Self-Contained EduRank Registry Portal
 * Logic: Fixed Max Marks + Punjabi Rule + Dynamic Exam Keys
 */
const SubjectEntryForm = ({ 
  classLevel, 
  onClassChange, 
  students, 
  onSave, 
  onCancel, 
  examType, 
  onExamTypeChange,
  currentUser 
}: any) => {

  // INTERNAL RULES ENGINE (Synchronized with App Enums)
  const EXAM_TYPES = ['Bimonthly', 'Term Exam', 'Preboard', 'Final Exam'];
  
  const getSubjectsForClass = (cls: string) => {
    const isMiddle = ['6', '7', '8'].includes(cls);
    return isMiddle ? [
      { key: 'pbi', label: 'Punjabi' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'eng', label: 'English' },
      { key: 'math', label: 'Math' },
      { key: 'sci', label: 'Science' },
      { key: 'sst', label: 'SST' },
      { key: 'comp', label: 'Computer' },
      { key: 'phy_edu', label: 'Phy Edu' },
      { key: 'agri', label: 'Agri' }
    ] : [
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
  };

  const getRuleMaxMarks = (type: string, sub: string) => {
    if (type === 'Bimonthly') return 20;
    if (type === 'Term Exam' || type === 'Preboard') return 80;
    if (type === 'Final Exam') {
      // Rule: Punjabi A/B in Final Exam = 75
      if (sub === 'pbi_a' || sub === 'pbi_b') return 75;
      return 100;
    }
    return 100;
  };

  // COMPONENT STATE
  const availableSubjects = useMemo(() => getSubjectsForClass(classLevel), [classLevel]);
  const [selectedSub, setSelectedSub] = useState(availableSubjects[0].key);
  const [localMarks, setLocalMarks] = useState<any>({});
  const [status, setStatus] = useState<any>({});

  // DERIVED VALUES
  const currentMax = getRuleMaxMarks(examType, selectedSub);
  const storageKey = `${examType.toLowerCase()}_${selectedSub.toLowerCase()}`;

  // SYNC DATA ON CONTEXT CHANGE
  useEffect(() => {
    const freshMarks: any = {};
    const freshStatus: any = {};
    students.forEach((s: any) => {
      const val = s.marks?.[storageKey];
      freshMarks[s.id] = val !== undefined ? val.toString() : '';
      freshStatus[s.id] = 'Stored';
    });
    setLocalMarks(freshMarks);
    setStatus(freshStatus);
  }, [selectedSub, examType, students, storageKey]);

  const handleInputChange = (sid: string, val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return; 
    setLocalMarks((prev: any) => ({ ...prev, [sid]: val }));
    setStatus((prev: any) => ({ ...prev, [sid]: 'Pending' }));
  };

  const handleCommitChanges = () => {
    if (currentUser?.role === 'STUDENT') return alert("❌ Access Denied.");

    const invalidCount = Object.values(localMarks).filter((v: any) => parseInt(v || '0') > currentMax).length;
    if (invalidCount > 0) {
      alert(`⚠️ Validation Error: ${invalidCount} entry(s) exceed Max Marks (${currentMax}). Please rectify.`);
      return;
    }

    const updatedData = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [storageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id])
      }
    }));

    onSave(updatedData);
    
    const savedStatus: any = {};
    students.forEach((s: any) => savedStatus[s.id] = 'Stored');
    setStatus(savedStatus);
    alert(`✅ ${examType} ${selectedSub.toUpperCase()} marks successfully committed.`);
  };

  const isSelectorDisabled = currentUser?.role === 'CLASS_INCHARGE';

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER SECTION */}
      <div className="p-8 bg-gradient-to-br from-indigo-700 via-violet-800 to-indigo-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <i className="fa-solid fa-file-pen text-2xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none">Assessment Entry Portal</h2>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.25em] mt-3 opacity-80">
                School Registry Sync Mode • {currentUser?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-black/15 p-5 rounded-[32px] border border-white/10 shadow-lg">
            <div className="flex flex-col min-w-[100px]">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Class</span>
              <select 
                disabled={isSelectorDisabled}
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[140px]">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Exam Type</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[130px]">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSub} 
                onChange={(e) => setSelectedSub(e.target.value)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {availableSubjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/10 px-6 py-2 rounded-2xl border border-white/20">
              <span className="text-[8px] font-black uppercase text-indigo-100">Max Marks</span>
              <span className="text-2xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#f8fafc]">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6 border-b border-slate-100">Roll No</th>
              <th className="px-10 py-6 border-b border-slate-100">Student Identity</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center w-56">Marks Input (/ {currentMax})</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.map((s: any, idx: number) => {
              const isViolation = parseInt(localMarks[s.id] || '0') > currentMax;
              const isPending = status[s.id] === 'Pending';

              return (
                <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/50 transition-colors group`}>
                  <td className="px-10 py-5">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      {s.rollNo}
                    </span>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{s.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic">UID: {s.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-[140px]">
                        <input 
                          type="text"
                          value={localMarks[s.id] || ''}
                          onChange={(e) => handleInputChange(s.id, e.target.value)}
                          className={`w-full p-3.5 text-center rounded-2xl font-black text-xl shadow-sm border-2 transition-all outline-none ${
                            isViolation ? 'border-red-400 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100' : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                          }`}
                          placeholder="-"
                        />
                        {isViolation && <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce shadow-lg border-2 border-white">!</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        isPending ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {isPending ? 'Pending' : 'Stored'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
             <i className="fa-solid fa-cloud-check"></i>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             {students.length} Records Loaded • Buffered Session Active
           </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-12 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCommitChanges}
            className="flex-1 sm:flex-none px-16 py-5 bg-slate-900 text-white font-black rounded-[28px] text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0.5 transition-all"
          >
            Commit To Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
