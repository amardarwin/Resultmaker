import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - STANDALONE COMPONENT
 * No external imports. Localized logic for Middle and High School schemas.
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
   * getSubjects - Requirement: Dynamic list based on Class
   * Condition 1: Middle (6, 7, 8)
   * Condition 2: High (9, 10)
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
    // High School (9th & 10th)
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

  // 2. Max Marks Logic (Requirement: Keep 75 marks for Punjabi A/B in Finals)
  const getMaxMarks = (exam: string, subKey: string) => {
    if (exam === 'Bimonthly') return 20;
    if (exam === 'Term Exam' || exam === 'Preboard') return 80;
    if (exam === 'Final Exam') {
      const lowerKey = subKey.toLowerCase();
      // Logic: Final Exam + Punjabi A or B = 75
      if (lowerKey === 'pbi_a' || lowerKey === 'pbi_b' || lowerKey === 'punjabi a' || lowerKey === 'punjabi b') {
        return 75;
      }
      return 100;
    }
    return 100;
  };

  const currentMax = useMemo(() => getMaxMarks(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // Generate a simple storage key (e.g., 'final_math', 'term_hindi')
  const generateStorageKey = (exam: string, sub: string) => {
    const prefix = exam.toLowerCase().split(' ')[0]; // 'final', 'term', 'preboard', 'bimonthly'
    return `${prefix}_${sub.toLowerCase()}`;
  };

  const storageKey = useMemo(() => generateStorageKey(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // 3. Hydrate Local Data when settings change
  useEffect(() => {
    const freshMarks: Record<string, string> = {};
    students.forEach((s: any) => {
      const savedVal = s.marks?.[storageKey];
      freshMarks[s.id] = (savedVal !== undefined && savedVal !== null) ? String(savedVal) : '';
    });
    setLocalMarks(freshMarks);
  }, [storageKey, students]);

  // Reset selected subject if class level changes schema
  useEffect(() => {
    if (!subjects.some(s => s.key === selectedSubKey)) {
      setSelectedSubKey(subjects[0]?.key || '');
    }
  }, [classLevel, subjects, selectedSubKey]);

  const handleInputChange = (id: string, val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    const violations = students.filter((s: any) => {
      const val = parseInt(localMarks[s.id] || '0', 10);
      return val > currentMax;
    });

    if (violations.length > 0) {
      alert(`⚠️ Validation Failed: ${violations.length} student(s) have marks exceeding the limit of ${currentMax}.`);
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
    alert(`✅ Success: Registry updated for ${selectedExam} - ${selectedSubKey.toUpperCase()}.`);
  };

  // 4. Download Award List Feature (Preserved)
  const handleDownloadAwardList = () => {
    if (students.length === 0) {
      alert("No student data available to download.");
      return;
    }

    const headers = ['Roll No', 'Student Name', 'Marks Obtained'];
    const rows = students.map((s: any) => [
      s.rollNo,
      `"${s.name.replace(/"/g, '""')}"`,
      localMarks[s.id] || '0'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const examSlug = selectedExam.replace(/\s+/g, '_');
    link.setAttribute('download', `AwardList_${classLevel}_${selectedSubKey}_${examSlug}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER CONTROLS */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-black">Subject Entry Portal</h2>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Active Class: {classLevel} • {currentUser?.name || 'Administrator'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Exam Type</span>
              <select 
                value={selectedExam} 
                onChange={(e) => setSelectedExam(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl"
              >
                <option value="Bimonthly">Bimonthly (Max 20)</option>
                <option value="Term Exam">Term Exam (Max 80)</option>
                <option value="Preboard">Preboard (Max 80)</option>
                <option value="Final Exam">Final Exam (Max 100/75)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSubKey} 
                onChange={(e) => setSelectedSubKey(e.target.value)}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black outline-none shadow-xl min-w-[180px]"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-indigo-500/30 px-6 py-2 rounded-2xl border border-white/10 min-w-[100px]">
              <span className="text-[8px] font-black uppercase text-indigo-200">Max Marks</span>
              <span className="text-2xl font-black text-white">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="max-h-[55vh] overflow-y-auto bg-slate-50/50">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white z-30 shadow-sm border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Roll No</th>
              <th className="px-10 py-6">Student Identity</th>
              <th className="px-10 py-6 text-center">Marks Input</th>
              <th className="px-10 py-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest">
                  No Students Enrolled in Class {classLevel}
                </td>
              </tr>
            ) : (
              students.map((s: any, idx: number) => {
                const val = localMarks[s.id] || '';
                const isViolation = parseInt(val, 10) > currentMax;

                return (
                  <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/50 transition-all`}>
                    <td className="px-10 py-5 font-black text-slate-500">{s.rollNo}</td>
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{s.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Profile</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="text"
                          value={val}
                          onChange={(e) => handleInputChange(s.id, e.target.value)}
                          className={`w-32 p-4 text-center rounded-2xl font-black text-2xl shadow-inner border-2 transition-all outline-none ${
                            isViolation ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 bg-white text-slate-900 focus:border-indigo-600'
                          }`}
                          placeholder="-"
                        />
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                          val === '' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {val === '' ? 'Awaiting' : 'Entered'}
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
      <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl shadow-inner"><i className="fa-solid fa-cloud-arrow-up"></i></div>
           <div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Class Registry</span>
             <span className="text-sm font-black text-slate-800">{students.length} Records Loaded</span>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel} 
            className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleDownloadAwardList} 
            className="px-8 py-5 bg-emerald-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-file-csv"></i>
            Award List
          </button>

          <button 
            onClick={handleCommit} 
            className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-slate-950 hover:-translate-y-1 transition-all"
          >
            Save Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
