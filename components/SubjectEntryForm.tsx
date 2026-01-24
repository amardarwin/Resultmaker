import React, { useState, useEffect } from 'react';

/**
 * SubjectEntryForm - Self-contained assessment portal for EduRank Pro.
 * Fixed: Storage keys mismatch, UI regression, and validation logic.
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

  // Internal Constants to maintain self-containment
  const EXAM_OPTIONS = ['Bimonthly', 'Term', 'Preboard', 'Final'];
  
  const getSubjectsForClass = (cls: string) => {
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

  const currentSubjects = getSubjectsForClass(classLevel);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubjects[0].key);
  
  // Local state for buffered marks entry
  const [localMarks, setLocalMarks] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<any>({});

  // Hardcoded Exam Rules Engine
  const getMaxMarks = (exam: string, sub: string) => {
    if (exam === 'Bimonthly') return 20;
    if (exam === 'Term' || exam === 'Preboard') return 80;
    if (exam === 'Final') {
      // Logic: Punjabi A/B in Final is 75 marks
      if (sub === 'pbi_a' || sub === 'pbi_b') return 75;
      return 100;
    }
    return 100;
  };

  const currentMax = getMaxMarks(examType, selectedSubjectKey);
  const markKey = `${examType.toLowerCase()}_${selectedSubjectKey}`;

  // Effect to load existing data whenever context (subject/exam/class) changes
  useEffect(() => {
    const initialMarks: any = {};
    const initialStatus: any = {};
    students.forEach((s: any) => {
      const val = s.marks?.[markKey];
      initialMarks[s.id] = val !== undefined ? val.toString() : '';
      initialStatus[s.id] = 'Saved';
    });
    setLocalMarks(initialMarks);
    setSaveStatus(initialStatus);
  }, [selectedSubjectKey, examType, students, markKey]);

  const handleMarkChange = (id: string, val: string) => {
    // Only allow numeric strings
    if (val !== '' && !/^\d+$/.test(val)) return;
    
    setLocalMarks((prev: any) => ({ ...prev, [id]: val }));
    setSaveStatus((prev: any) => ({ ...prev, [id]: 'Pending' }));
  };

  const handleFinalSave = () => {
    // 1. Permission check
    if (currentUser?.role === 'STUDENT') {
      alert("❌ Unauthorized: Student accounts cannot modify records.");
      return;
    }

    // 2. Multi-point Validation check
    const invalidEntries = Object.entries(localMarks).filter(([id, val]: any) => {
      const num = parseInt(val || '0');
      return num > currentMax;
    });

    if (invalidEntries.length > 0) {
      alert(`⚠️ Build Error: ${invalidEntries.length} entries exceed the maximum limit of ${currentMax}. Fix these before saving.`);
      return;
    }

    // 3. Construct updated data mapping
    const updatedStudents = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [markKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id])
      }
    }));

    // 4. Pass back to main application controller
    onSave(updatedStudents);
    
    // 5. Update UI state to confirmed
    const confirmedStatus: any = {};
    students.forEach((s: any) => confirmedStatus[s.id] = 'Saved');
    setSaveStatus(confirmedStatus);
    
    alert(`✅ Successfully synced ${selectedSubjectKey.toUpperCase()} marks for ${examType} assessment.`);
  };

  const isSelectorLocked = currentUser?.role === 'CLASS_INCHARGE';

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* 📝 Assessment Portal Header */}
      <div className="p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
                <i className="fa-solid fa-file-signature text-3xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight leading-none">📝 Assessment Entry Portal</h2>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">
                  Registry Sync Mode • {currentUser?.name} Authorized
                </p>
              </div>
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-4 bg-black/20 p-5 rounded-[32px] backdrop-blur-3xl border border-white/10 shadow-lg">
            
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1.5 opacity-80">Class Unit</span>
              <select 
                disabled={isSelectorLocked}
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value)}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 disabled:opacity-50"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1.5 opacity-80">Exam Type</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value)}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30"
              >
                {EXAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1.5 opacity-80">Subject Focus</span>
              <select 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value)}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30"
              >
                {currentSubjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/15 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-100 mb-0.5">Max Score</span>
              <span className="text-2xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Modern Interactive Entry Sheet */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#fcfdfe]">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-7 border-b border-slate-100">Roll No</th>
              <th className="px-10 py-7 border-b border-slate-100">Student Identity</th>
              <th className="px-10 py-7 border-b border-slate-100">Parent/Guardian</th>
              <th className="px-10 py-7 border-b border-slate-100 text-center w-56">Input Box (/ {currentMax})</th>
              <th className="px-10 py-7 border-b border-slate-100 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-40">No Enrollment Data Detected</td></tr>
            ) : (
              students.map((student: any, idx: number) => {
                const currentVal = parseInt(localMarks[student.id] || '0');
                const isViolation = currentVal > currentMax;
                const isPending = saveStatus[student.id] === 'Pending';

                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/30 transition-all duration-200 group`}>
                    <td className="px-10 py-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {student.rollNo}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{student.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">UID: {student.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-bold text-slate-500 uppercase italic opacity-60">
                        {student.fatherName || 'Not Available'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        <div className="relative w-full max-w-[150px]">
                          <input 
                            type="text"
                            value={localMarks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className={`w-full p-4 text-center rounded-2xl font-black text-xl shadow-sm border-2 transition-all outline-none ${
                              isViolation 
                                ? 'border-red-500 bg-red-50 text-red-600 animate-shake focus:ring-4 focus:ring-red-100' 
                                : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isViolation && (
                            <div className="absolute -top-3 -right-3 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs animate-bounce shadow-xl border-4 border-white">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          isPending 
                            ? 'bg-amber-100 text-amber-600 border border-amber-200 animate-pulse' 
                            : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        }`}>
                          {isPending ? 'Pending' : 'Saved'}
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

      {/* 🛠 Footer Actions Console */}
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                {i}
              </div>
            ))}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
              Active Session Status
            </span>
            <span className="text-[11px] font-black text-indigo-600 uppercase">
              {students.length} Records Loaded • {currentMax} Score Buffer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-12 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
          >
            Abort Changes
          </button>
          <button 
            onClick={handleFinalSave}
            className="flex-1 sm:flex-none px-16 py-5 bg-slate-900 text-white font-black rounded-[24px] text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0.5 transition-all"
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
