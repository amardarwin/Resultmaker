
import React, { useState, useEffect } from 'react';
import { Student, ClassLevel, StudentMarks, Role } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { exportAwardList } from '../utils/export';
import { useAuth } import React, { useState, useEffect, useMemo } from 'react';

/**
 * SubjectEntryForm - Self-contained component for EduRank Pro Result System
 * Fixed storage keys: ${examType}_${subjectKey}
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

  // Subject Definitions (Internalized to prevent import errors)
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

  const currentSubjects = getSubjects(classLevel);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubjects[0].key);
  const [localMarks, setLocalMarks] = useState<any>({});
  const [rowStatus, setRowStatus] = useState<any>({});

  // Exam Rules Engine
  const getMaxMarks = (exam: string, subKey: string) => {
    if (exam === 'Bimonthly') return 20;
    if (exam === 'Term' || exam === 'Preboard') return 80;
    if (exam === 'Final') {
      if (subKey === 'pbi_a' || subKey === 'pbi_b') return 75;
      return 100;
    }
    return 100;
  };

  const currentMax = getMaxMarks(examType, selectedSubjectKey);
  const markStorageKey = `${examType.toLowerCase()}_${selectedSubjectKey}`;

  // Load existing data when context changes
  useEffect(() => {
    const marks: any = {};
    const stats: any = {};
    students.forEach((s: any) => {
      const existingValue = s.marks?.[markStorageKey];
      marks[s.id] = existingValue !== undefined ? existingValue.toString() : '';
      stats[s.id] = 'Saved';
    });
    setLocalMarks(marks);
    setRowStatus(stats);
  }, [selectedSubjectKey, examType, students, markStorageKey]);

  const handleInputChange = (studentId: string, val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return; // Numeric only
    setLocalMarks((prev: any) => ({ ...prev, [studentId]: val }));
    setRowStatus((prev: any) => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleCommit = () => {
    // 1. Permission Check
    const role = currentUser?.role;
    if (role === 'STUDENT') {
      alert("❌ Unauthorized: Students cannot enter marks.");
      return;
    }

    // 2. Strict Validation
    const invalidCount = Object.entries(localMarks).filter(([id, val]: [string, any]) => {
      const score = parseInt(val || '0');
      return score > currentMax;
    }).length;

    if (invalidCount > 0) {
      alert(`⚠️ Validation Failed: ${invalidCount} entry(s) exceed the Max Marks (${currentMax}). Please correct highlighted errors.`);
      return;
    }

    // 3. Prepare Updated Dataset
    const updatedStudents = students.map((s: any) => ({
      ...s,
      marks: {
        ...(s.marks || {}),
        [markStorageKey]: localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id])
      }
    }));

    // 4. Save
    onSave(updatedStudents);
    
    // Update local status UI
    const allSaved: any = {};
    students.forEach((s: any) => allSaved[s.id] = 'Saved');
    setRowStatus(allSaved);
    
    alert(`✅ Successfully saved ${selectedSubjectKey} marks for ${examType} exams.`);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* 📝 Assessment Header */}
      <div className="p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <i className="fa-solid fa-file-pen text-2xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight leading-none">Assessment Entry Portal</h2>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                  EduRank Pro • Registry Protocol Active
                </p>
              </div>
            </div>
          </div>

          {/* Controls Hub */}
          <div className="flex flex-wrap items-center gap-4 bg-black/20 p-5 rounded-[32px] border border-white/10 shadow-lg">
            
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Class</span>
              <select 
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value)}
                disabled={currentUser?.role === 'CLASS_INCHARGE'}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 disabled:opacity-50"
              >
                {['6','7','8','9','10'].map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Exam Stage</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30"
              >
                {['Bimonthly', 'Term', 'Preboard', 'Final'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30"
              >
                {currentSubjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/10 px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-100">Max Score</span>
              <span className="text-2xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Entry Table */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#fcfdfe]">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6 border-b border-slate-100">Roll No</th>
              <th className="px-8 py-6 border-b border-slate-100">Student Name</th>
              <th className="px-8 py-6 border-b border-slate-100">Father's Name</th>
              <th className="px-8 py-6 border-b border-slate-100 text-center w-56">Entry (/ {currentMax})</th>
              <th className="px-10 py-6 border-b border-slate-100 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-300 font-black uppercase tracking-widest opacity-50">No Student Data Available</td></tr>
            ) : (
              students.map((student: any, idx: number) => {
                const markVal = parseInt(localMarks[student.id] || '0');
                const isError = markVal > currentMax;
                const isPending = rowStatus[student.id] === 'Pending';

                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/50 transition-colors group`}>
                    <td className="px-10 py-5">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {student.rollNo}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-800">{student.name}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-400 uppercase italic opacity-70">
                        {student.fatherName || 'Not Provided'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        <div className="relative w-full max-w-[140px]">
                          <input 
                            type="text"
                            value={localMarks[student.id] || ''}
                            onChange={(e) => handleInputChange(student.id, e.target.value)}
                            className={`w-full p-3.5 text-center rounded-2xl font-black text-xl shadow-sm border-2 transition-all outline-none ${
                              isError 
                                ? 'border-red-400 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100' 
                                : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isError && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg animate-bounce">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isPending ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'
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

      {/* 🛠 Footer Actions */}
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {students.length} Records Active • Validating Against {currentMax}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCommit}
            className="flex-1 sm:flex-none px-14 py-4 bg-slate-900 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all"
          >
            Commit To Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
 '../contexts/AuthContext';

interface SubjectEntryFormProps {
  classLevel: ClassLevel;
  students: Student[];
  onSave: (updatedStudents: Student[]) => void;
  onCancel: () => void;
  initialMaxMarks: number;
}

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ classLevel, students, onSave, onCancel, initialMaxMarks }) => {
  const { user, canEditSubject } = useAuth();
  const allClassSubjects = GET_SUBJECTS_FOR_CLASS(classLevel);
  
  // Logic: Only show subjects the user has permission to edit
  const editableSubjects = allClassSubjects.filter(s => canEditSubject(s.key, classLevel));

  const [selectedSubject, setSelectedSubject] = useState<keyof StudentMarks>(() => {
    return editableSubjects.length > 0 ? editableSubjects[0].key : allClassSubjects[0].key;
  });

  const [localMarks, setLocalMarks] = useState<{ [studentId: string]: number }>({});
  const [subjectMaxMarks, setSubjectMaxMarks] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    allClassSubjects.forEach(s => map[s.key] = initialMaxMarks);
    return map;
  });

  const currentMax = subjectMaxMarks[selectedSubject] || initialMaxMarks;

  useEffect(() => {
    const initialMarks: { [id: string]: number } = {};
    students.forEach(s => {
      initialMarks[s.id] = s.marks[selectedSubject] || 0;
    });
    setLocalMarks(initialMarks);
  }, [selectedSubject, students]);

  const handleMarkChange = (studentId: string, value: string) => {
    const num = value === '' ? 0 : parseInt(value);
    setLocalMarks(prev => ({ ...prev, [studentId]: isNaN(num) ? 0 : Math.min(currentMax, num) }));
  };

  const handleMaxMarksChange = (val: string) => {
    const num = parseInt(val) || 0;
    setSubjectMaxMarks(prev => ({ ...prev, [selectedSubject]: num }));
  };

  const handleSave = () => {
    if (!canEditSubject(selectedSubject, classLevel)) {
      return alert("Access Denied: You do not have permission to edit this subject's marks.");
    }
    const updated = students.map(s => ({
      ...s,
      marks: { ...s.marks, [selectedSubject]: localMarks[s.id] || 0 }
    }));
    onSave(updated);
  };

  const handleDownloadAwardList = () => {
    const currentLabel = allClassSubjects.find(s => s.key === selectedSubject)?.label || 'Subject';
    exportAwardList(students, classLevel, selectedSubject, currentLabel, currentMax);
  };

  const subjectLabel = allClassSubjects.find(s => s.key === selectedSubject)?.label || '';

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="p-6 bg-indigo-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center">
            <i className="fa-solid fa-clipboard-list mr-3"></i>
            Award List Entry
          </h2>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mt-1 opacity-80">
            Class {classLevel} • {editableSubjects.length} Subject(s) Editable
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase mb-1 text-indigo-200">Select Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value as keyof StudentMarks)}
              className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-300"
            >
              {editableSubjects.map(sub => (
                <option key={sub.key} value={sub.key}>{sub.label} {sub.type === 'GRADING' ? '(G)' : ''}</option>
              ))}
              {editableSubjects.length === 0 && <option disabled>No subjects assigned</option>}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase mb-1 text-indigo-200">Max Marks</label>
            <div className="flex items-center space-x-1">
              <input 
                type="number"
                value={currentMax}
                onChange={(e) => handleMaxMarksChange(e.target.value)}
                className="w-20 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
        {editableSubjects.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <i className="fa-solid fa-lock text-6xl text-slate-200 mb-4"></i>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Entry Locked</h3>
            <p className="text-sm text-slate-400 mt-2">You are not assigned to enter marks for any subjects in Class {classLevel}.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] text-slate-400 font-black uppercase bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
              <tr>
                <th className="px-8 py-4">Roll No</th>
                <th className="px-8 py-4">Student Name</th>
                <th className="px-8 py-4 text-center w-40">Entry (/{currentMax})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold italic">No students in this class.</td></tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/50 transition-colors`}>
                    <td className="px-8 py-4 font-black text-slate-500">{student.rollNo}</td>
                    <td className="px-8 py-4 font-bold text-slate-800">{student.name}</td>
                    <td className="px-8 py-4 flex justify-center">
                      <input 
                        type="number"
                        value={localMarks[student.id] ?? ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        className="w-full p-2 text-center border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-black text-indigo-700 shadow-sm"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button onClick={handleDownloadAwardList} disabled={students.length === 0} className="px-5 py-2.5 bg-white text-indigo-600 border border-indigo-200 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center shadow-sm">
          <i className="fa-solid fa-download mr-2"></i> DOWNLOAD AWARD LIST
        </button>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700">Discard</button>
          <button 
            onClick={handleSave} 
            disabled={students.length === 0 || editableSubjects.length === 0} 
            className="px-10 py-2.5 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
