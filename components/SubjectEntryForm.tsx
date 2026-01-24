import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - Modern Assessment Entry Portal
 * Restore high-fidelity UI and fix persistence mismatch.
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

  // Internal Logic for Subjects (Self-contained)
  const getSubjects = (cls: string) => {
    const isMiddle = ['6', '7', '8'].includes(cls);
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
        { key: 'agri', label: 'Agri' },
      ];
    }
    return [
      { key: 'pbi_a', label: 'Punjabi A' },
      { key: 'pbi_b', label: 'Punjabi B' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'eng', label: 'English' },
      { key: 'math', label: 'Math' },
      { key: 'sci', label: 'Science' },
      { key: 'sst', label: 'SST' },
      { key: 'comp', label: 'Computer' },
      { key: 'phy_edu', label: 'Phy Edu' },
    ];
  };

  // Internal Logic for Max Marks (Self-contained)
  const getMaxMarks = (exam: string, subKey: string) => {
    if (exam === 'Bimonthly') return 20;
    if (exam === 'Term' || exam === 'Preboard') return 80;
    if (exam === 'Final') {
      if (subKey === 'pbi_a' || subKey === 'pbi_b') return 75;
      return 100;
    }
    return 100;
  };

  const currentSubjects = useMemo(() => getSubjects(classLevel), [classLevel]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubjects[0].key);
  const currentMax = getMaxMarks(examType, selectedSubjectKey);
  
  // Storage Key Logic (Lowercase key = ${examType}_${subject})
  const markKey = `${examType.toLowerCase()}_${selectedSubjectKey.toLowerCase()}`;

  const [localMarks, setLocalMarks] = useState<any>({});
  const [rowStatus, setRowStatus] = useState<any>({});

  // Reset and Load
  useEffect(() => {
    const initialMarks: any = {};
    const initialStatus: any = {};
    students.forEach((s: any) => {
      const savedVal = s.marks?.[markKey];
      initialMarks[s.id] = savedVal !== undefined ? savedVal.toString() : '';
      initialStatus[s.id] = 'Saved';
    });
    setLocalMarks(initialMarks);
    setRowStatus(initialStatus);
  }, [selectedSubjectKey, examType, students, markKey]);

  const handleInputChange = (id: string, val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks((prev: any) => ({ ...prev, [id]: val }));
    setRowStatus((prev: any) => ({ ...prev, [id]: 'Pending' }));
  };

  const handleSaveAll = () => {
    // Permission check
    if (currentUser?.role === 'STUDENT') {
      alert("❌ Unauthorized: Students cannot enter marks.");
      return;
    }

    // Validation
    const overLimitEntries = Object.entries(localMarks).filter(([id, val]: [string, any]) => {
      const score = parseInt(val || '0');
      return score > currentMax;
    });

    if (overLimitEntries.length > 0) {
      alert(`⚠️ Marks Validation Failed: ${overLimitEntries.length} entries exceed the maximum allowed marks (${currentMax}) for ${examType} exams. Please correct them.`);
      return;
    }

    // Update students data
    const updatedStudents = students.map((s: any) => {
      const val = localMarks[s.id];
      return {
        ...s,
        marks: {
          ...(s.marks || {}),
          [markKey]: val === '' ? 0 : parseInt(val)
        }
      };
    });

    onSave(updatedStudents);

    // Visual feedback
    const savedStatus: any = {};
    students.forEach((s: any) => savedStatus[s.id] = 'Saved');
    setRowStatus(savedStatus);
    
    alert(`✅ ${selectedSubjectKey.toUpperCase()} marks successfully committed to registry for ${examType}.`);
  };

  const isClassLocked = currentUser?.role === 'CLASS_INCHARGE';

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* 📝 Modern Purple Header */}
      <div className="p-10 bg-gradient-to-br from-indigo-700 via-violet-800 to-indigo-900 text-white relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-[28px] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
                <i className="fa-solid fa-file-signature text-3xl"></i>
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight leading-none">Assessment Entry Portal</h2>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.25em] mt-3 opacity-90">
                  Registry Sync Protocol • {currentUser?.name || 'Authorized Session'}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Row (Locked Class if Incharge) */}
          <div className="flex flex-wrap items-center gap-4 bg-black/20 p-6 rounded-[36px] backdrop-blur-2xl border border-white/10 shadow-2xl">
            <div className="flex flex-col min-w-[120px]">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Class Unit</span>
              <select 
                disabled={isClassLocked}
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value)}
                className={`w-full px-5 py-3 rounded-2xl text-xs font-black outline-none transition-all shadow-sm ${
                  isClassLocked ? 'bg-white/10 text-white/50 cursor-not-allowed border-transparent' : 'bg-white text-slate-900 border-white focus:ring-4 focus:ring-indigo-400/30'
                }`}
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Subject Focus</span>
              <select 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value)}
                className="bg-white text-slate-900 px-5 py-3 rounded-2xl text-xs font-black outline-none border-white focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {currentSubjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Exam Category</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value)}
                className="bg-white text-slate-900 px-5 py-3 rounded-2xl text-xs font-black outline-none border-white focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {['Bimonthly', 'Term', 'Preboard', 'Final'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/15 px-6 py-2 rounded-2xl border border-white/15">
              <span className="text-[8px] font-black uppercase text-indigo-100 mb-0.5">Max Score</span>
              <span className="text-2xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Modern Interactive Entry Sheet */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#f8fafc]">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-7 border-b border-slate-100">Roll No</th>
              <th className="px-10 py-7 border-b border-slate-100">Student Identity</th>
              <th className="px-10 py-7 border-b border-slate-100">Father's Name</th>
              <th className="px-10 py-7 border-b border-slate-100 text-center w-64">Marks Entry (/ {currentMax})</th>
              <th className="px-10 py-7 border-b border-slate-100 text-center">Commit State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-40">No enrollment records found</td></tr>
            ) : (
              students.map((student: any, idx: number) => {
                const isOverMax = parseInt(localMarks[student.id] || '0') > currentMax;
                const isPending = rowStatus[student.id] === 'Pending';

                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/40 transition-all duration-200 group`}>
                    <td className="px-10 py-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-sm text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {student.rollNo}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{student.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">REF: {student.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-bold text-slate-500 uppercase italic opacity-70">
                        {student.fatherName || 'Not Recorded'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        <div className="relative w-full max-w-[160px]">
                          <input 
                            type="text"
                            value={localMarks[student.id] || ''}
                            onChange={(e) => handleInputChange(student.id, e.target.value)}
                            className={`w-full p-4.5 text-center rounded-[24px] font-black text-2xl shadow-sm border-2 transition-all outline-none ${
                              isOverMax 
                                ? 'border-red-500 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100 animate-shake' 
                                : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isOverMax && (
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs animate-bounce shadow-xl border-4 border-white">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          isPending 
                            ? 'bg-amber-100 text-amber-600 border-amber-200 animate-pulse' 
                            : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                        }`}>
                          {isPending ? 'Pending' : 'Stored'}
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

      {/* 🛠 Interactive Footer Actions */}
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[11px] font-black text-indigo-600 shadow-sm">
                {i}
              </div>
            ))}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Entry Status</span>
            <span className="text-[11px] font-black text-indigo-600 uppercase">
              {students.length} Records Loaded • Buffered Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-12 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
          >
            Discard
          </button>
          <button 
            onClick={handleSaveAll}
            className="flex-1 sm:flex-none px-16 py-5 bg-slate-900 text-white font-black rounded-[28px] text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0.5 transition-all"
          >
            <i className="fa-solid fa-cloud-arrow-up mr-3 opacity-50"></i>
            Commit To Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
