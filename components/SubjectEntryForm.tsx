import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - Standalone Version
 * Rebuilt from scratch to ensure no external dependencies cause crashes.
 */
const SubjectEntryForm: React.FC<any> = ({ 
  classLevel = '6', 
  onClassChange, 
  students = [], 
  onSave, 
  onCancel, 
  examType = 'Final Exam', 
  onExamTypeChange,
  currentUser 
}) => {

  // Local Subject Configuration (Prevents crashes from missing constants)
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
        { key: 'comp', label: 'Comp' },
        { key: 'phy_edu', label: 'Phy Edu' },
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
      { key: 'comp', label: 'Comp' },
    ];
  };

  const subjects = useMemo(() => getSubjects(classLevel), [classLevel]);

  // Initial Subject Selection
  const [selectedSubKey, setSelectedSubKey] = useState<string>(() => subjects[0]?.key || '');
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'Stored' | 'Pending'>>({});

  // Sync Subject selection on classLevel change
  useEffect(() => {
    if (!subjects.some(s => s.key === selectedSubKey)) {
      setSelectedSubKey(subjects[0]?.key || '');
    }
  }, [classLevel, subjects, selectedSubKey]);

  // Max Marks Logic (As per requirements)
  const getMaxMarks = (type: string, subKey: string) => {
    if (type === 'Bimonthly') return 20;
    if (type === 'Term Exam' || type === 'Preboard') return 80;
    if (type === 'Final Exam') {
      const lower = subKey.toLowerCase();
      if (lower.includes('pbi') || lower.includes('punjabi')) {
        return 75; // Logic: Final + Punjabi A/B = 75
      }
      return 100;
    }
    return 100;
  };

  const currentMax = useMemo(() => getMaxMarks(examType, selectedSubKey), [examType, selectedSubKey]);
  const storageKey = useMemo(() => `${examType.toLowerCase()}_${selectedSubKey.toLowerCase()}`, [examType, selectedSubKey]);

  // Data Hydration from current students prop
  useEffect(() => {
    const marks: Record<string, string> = {};
    const statuses: Record<string, 'Stored' | 'Pending'> = {};
    
    students.forEach((s: any) => {
      const val = s.marks?.[storageKey];
      marks[s.id] = (val !== undefined && val !== null) ? String(val) : '';
      statuses[s.id] = 'Stored';
    });
    
    setLocalMarks(marks);
    setSaveStatus(statuses);
  }, [storageKey, students]);

  const handleInputChange = (studentId: string, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    setSaveStatus(prev => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleCommit = () => {
    const violations = students.filter((s: any) => {
      const val = parseInt(localMarks[s.id] || '0', 10);
      return val > currentMax;
    });

    if (violations.length > 0) {
      alert(`⚠️ Validation Error: ${violations.length} student(s) have marks exceeding ${currentMax}.`);
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
    alert('✅ Data committed to Registry.');
    
    // Reset statuses to stored
    const resetStatus: Record<string, 'Stored' | 'Pending'> = {};
    students.forEach((s: any) => resetStatus[s.id] = 'Stored');
    setSaveStatus(resetStatus);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-black">Entry Portal</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Registry Session • Class {classLevel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Select Class</span>
              <select 
                value={classLevel} 
                onChange={(e) => onClassChange && onClassChange(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none"
              >
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Exam Header</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange && onExamTypeChange(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none"
              >
                <option value="Bimonthly">Bimonthly</option>
                <option value="Term Exam">Term Exam</option>
                <option value="Preboard">Preboard</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Subject Column</span>
              <select 
                value={selectedSubKey} 
                onChange={(e) => setSelectedSubKey(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-indigo-500/30 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-200">Limit</span>
              <span className="text-2xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white z-30 shadow-sm border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Roll No</th>
              <th className="px-10 py-6">Student Name</th>
              <th className="px-10 py-6 text-center">Marks Input</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr><td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No records for this Class</td></tr>
            ) : (
              students.map((s: any, idx: number) => (
                <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/50 transition-all`}>
                  <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                  <td className="px-10 py-5 font-black text-slate-800">{s.name}</td>
                  <td className="px-10 py-5">
                    <div className="flex justify-center">
                      <input 
                        type="text"
                        value={localMarks[s.id] || ''}
                        onChange={(e) => handleInputChange(s.id, e.target.value)}
                        className={`w-32 p-3 text-center rounded-2xl font-black text-xl shadow-inner border-2 transition-all outline-none ${
                          parseInt(localMarks[s.id] || '0') > currentMax ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-100 bg-white focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        saveStatus[s.id] === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        {saveStatus[s.id] === 'Pending' ? 'Pending' : 'Stored'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-8">
        <button onClick={onCancel} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700">Back to Dashboard</button>
        <button onClick={handleCommit} className="px-16 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-slate-950 transition-all">Save Changes</button>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
