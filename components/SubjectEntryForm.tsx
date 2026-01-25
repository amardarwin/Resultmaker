import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - SECURE STANDALONE COMPONENT
 * Implements:
 * 1. Strict Role-based permissions (Admin/Incharge/Teacher)
 * 2. Dynamic Subject Schemas (Middle/High)
 * 3. Specialized Max Marks Logic (Pbi A/B rules)
 * 4. CSV Award List Export
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
   * getSubjects - Dynamic list based on Class
   * Middle: Single Punjabi + Agri
   * High: Split Punjabi + No Agri
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
   * canEdit - Requirement 1: Strict Permissions Logic
   * Admin: True
   * Incharge: True if class matches
   * Teacher: True if class matches AND subject matches
   */
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const { role, assignedClass, teachingSubjects } = currentUser;

    // ADMIN: Can edit everything
    if (role === 'ADMIN') return true;

    // CLASS_INCHARGE: Can edit if assigned class matches current selection
    if (role === 'CLASS_INCHARGE') {
      return String(assignedClass) === String(classLevel);
    }

    // SUBJECT_TEACHER: Can edit if class matches AND subject is in their teaching list
    if (role === 'SUBJECT_TEACHER') {
      const classMatch = String(assignedClass) === String(classLevel);
      const subjectMatch = teachingSubjects && Array.isArray(teachingSubjects) && teachingSubjects.includes(selectedSubKey);
      return classMatch && subjectMatch;
    }

    return false;
  }, [currentUser, classLevel, selectedSubKey]);

  /**
   * getMaxMarks - Requirement 3: Updated Marks Logic
   * Bimonthly: 20
   * Term/Preboard: 80 (Pbi A/B: 65)
   * Final: 100 (Pbi A/B: 75)
   */
  const getMaxMarks = (exam: string, subKey: string) => {
    const lowerKey = subKey.toLowerCase();
    const isPbiAB = lowerKey === 'pbi_a' || lowerKey === 'pbi_b' || lowerKey === 'punjabi a' || lowerKey === 'punjabi b';

    if (exam === 'Bimonthly') return 20;

    if (exam === 'Term Exam' || exam === 'Preboard') {
      if (isPbiAB) return 65; // New 65 Mark Rule
      return 80;
    }

    if (exam === 'Final Exam') {
      if (isPbiAB) return 75; // Original 75 Mark Rule
      return 100;
    }

    return 100;
  };

  const currentMax = useMemo(() => getMaxMarks(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  /**
   * generateStorageKey - Standards for student.marks keys
   */
  const generateStorageKey = (exam: string, sub: string) => {
    const prefix = exam.toLowerCase().split(' ')[0];
    return `${prefix}_${sub.toLowerCase()}`;
  };

  const storageKey = useMemo(() => generateStorageKey(selectedExam, selectedSubKey), [selectedExam, selectedSubKey]);

  // Sync data from props to local state
  useEffect(() => {
    const freshMarks: Record<string, string> = {};
    students.forEach((s: any) => {
      const savedVal = s.marks?.[storageKey];
      freshMarks[s.id] = (savedVal !== undefined && savedVal !== null) ? String(savedVal) : '';
    });
    setLocalMarks(freshMarks);
  }, [storageKey, students]);

  // Reset subject if class change makes selection invalid
  useEffect(() => {
    if (!subjects.some(s => s.key === selectedSubKey)) {
      setSelectedSubKey(subjects[0]?.key || '');
    }
  }, [classLevel, subjects, selectedSubKey]);

  const handleInputChange = (id: string, val: string) => {
    if (!canEdit) return; 
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = () => {
    if (!canEdit) {
      alert("🚫 Permission Denied: You do not have permission to edit this class or subject.");
      return;
    }

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
    alert(`✅ Success: Updated ${selectedExam} marks for ${selectedSubKey.toUpperCase()}.`);
  };

  const handleDownloadAwardList = () => {
    if (students.length === 0) return alert("No data to export.");

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
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black">Subject Entry Portal</h2>
              {!canEdit && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-lock"></i>
                  Locked
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Class {classLevel} • {currentUser?.name || 'User'} ({currentUser?.role || 'Guest'})
            </p>
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
                <option value="Term Exam">Term Exam</option>
                <option value="Preboard">Preboard</option>
                <option value="Final Exam">Final Exam</option>
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

      {/* DATA AREA */}
      <div className="max-h-[55vh] overflow-y-auto bg-slate-50/50">
        {!canEdit && (
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-center gap-4">
             <i className="fa-solid fa-ban text-red-500"></i>
             <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">
               Restricted Access: You are not authorized to edit marks for Class {classLevel} - {selectedSubKey.toUpperCase()}.
             </span>
          </div>
        )}
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
                  No records found
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
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Verified Entry</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="text"
                          value={val}
                          readOnly={!canEdit}
                          disabled={!canEdit}
                          onChange={(e) => handleInputChange(s.id, e.target.value)}
                          className={`w-32 p-4 text-center rounded-2xl font-black text-2xl shadow-inner border-2 transition-all outline-none ${
                            !canEdit ? 'bg-gray-200 border-gray-300 text-slate-400 cursor-not-allowed' :
                            isViolation ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 
                            'border-slate-100 bg-white text-slate-900 focus:border-indigo-600'
                          }`}
                          placeholder={canEdit ? "-" : "N/A"}
                        />
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                          val === '' ? 'bg-slate-100 text-slate-400 border-slate-200' : 
                          !canEdit ? 'bg-slate-50 text-slate-300 border-slate-100' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {val === '' ? 'Empty' : 'Entered'}
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

      {/* FOOTER */}
      <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${canEdit ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
             <i className={`fa-solid ${canEdit ? 'fa-pen-nib' : 'fa-lock'}`}></i>
           </div>
           <div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Class Registry</span>
             <span className="text-sm font-black text-slate-800">{students.length} Total Records</span>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel} 
            className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
          >
            Go Back
          </button>
          
          <button 
            onClick={handleDownloadAwardList} 
            className="px-8 py-5 bg-emerald-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-file-csv"></i>
            Award List
          </button>

          <button 
            onClick={handleCommit} 
            disabled={!canEdit}
            className={`px-12 py-5 font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl transition-all ${
              canEdit 
              ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-slate-950 hover:-translate-y-1' 
              : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
            }`}
          >
            Commit Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
