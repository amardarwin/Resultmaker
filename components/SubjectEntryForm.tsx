import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassLevel, StudentMarks, Role, ExamType, SubjectConfig } from '../types';
import { GET_SUBJECTS_FOR_CLASS, ALL_CLASSES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';

interface SubjectEntryFormProps {
  classLevel: ClassLevel;
  onClassChange: (cls: ClassLevel) => void;
  students: Student[];
  onSave: (updatedStudents: Student[]) => void;
  onCancel: () => void;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
}

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ 
  classLevel, 
  onClassChange,
  students, 
  onSave, 
  onCancel,
  examType,
  onExamTypeChange
}) => {
  const { user, canEditSubject, accessibleClasses } = useAuth();
  
  // Identify editable subjects for the current class
  const allClassSubjects = GET_SUBJECTS_FOR_CLASS(classLevel);
  const editableSubjects = useMemo(() => 
    allClassSubjects.filter(s => canEditSubject(s.key, classLevel)),
    [allClassSubjects, canEditSubject, classLevel]
  );

  // Subject selection state
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<keyof StudentMarks>(() => {
    return editableSubjects.length > 0 ? editableSubjects[0].key : allClassSubjects[0].key;
  });

  // Calculate rules based on current selections
  const selectedSubjectConfig = useMemo(() => 
    allClassSubjects.find(s => s.key === selectedSubjectKey)!,
    [allClassSubjects, selectedSubjectKey]
  );
  
  const currentMax = getExamMaxMarks(examType, selectedSubjectConfig);
  const storageKey = getMarkKey(examType, selectedSubjectKey as string);

  // Local state for buffered marks and UI status
  const [localMarks, setLocalMarks] = useState<{ [studentId: string]: string }>({});
  const [rowStatus, setRowStatus] = useState<{ [studentId: string]: 'Saved' | 'Pending' }>({});

  // Reset and load marks whenever class, subject, or exam type changes
  useEffect(() => {
    const initialMarks: { [id: string]: string } = {};
    const initialStatus: { [id: string]: 'Saved' | 'Pending' } = {};
    
    students.forEach(s => {
      const val = s.marks[storageKey];
      initialMarks[s.id] = val !== undefined ? val.toString() : '';
      initialStatus[s.id] = 'Saved';
    });
    
    setLocalMarks(initialMarks);
    setRowStatus(initialStatus);
  }, [selectedSubjectKey, examType, students, storageKey]);

  const handleMarkChange = (studentId: string, value: string) => {
    // Only allow numeric input
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    setRowStatus(prev => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleCommit = () => {
    // Permission check
    if (!canEditSubject(selectedSubjectKey, classLevel)) {
      alert("❌ Error: You do not have permission to modify these records.");
      return;
    }

    // Validation engine: Check against exam rules
    const errorCount = Object.entries(localMarks).filter(([id, val]) => {
      const score = parseInt(val || '0');
      return score > currentMax;
    }).length;

    if (errorCount > 0) {
      alert(`⚠️ Critical Error: ${errorCount} entries exceed the maximum allowed score of ${currentMax} for ${examType} assessments. Correct them to continue.`);
      return;
    }

    // Persist to parent/storage
    const updated = students.map(s => {
      const markValue = localMarks[s.id] === '' ? 0 : parseInt(localMarks[s.id]);
      return {
        ...s,
        marks: { 
          ...s.marks, 
          [storageKey]: markValue 
        }
      };
    });

    onSave(updated);
    
    // Update visual feedback
    const savedStatus: { [id: string]: 'Saved' | 'Pending' } = {};
    students.forEach(s => savedStatus[s.id] = 'Saved');
    setRowStatus(savedStatus);
  };

  const isClassSelectorLocked = user?.role === Role.CLASS_INCHARGE;

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* 📝 Assessment Header with Gradient */}
      <div className="p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
                <i className="fa-solid fa-file-signature text-2xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight leading-none">Assessment Entry Portal</h2>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-90">
                  EduRank Pro • Class {classLevel} Verification Level
                </p>
              </div>
            </div>
          </div>

          {/* Controls Row: Class, Subject, Exam Selection */}
          <div className="flex flex-wrap items-center gap-4 bg-black/15 p-5 rounded-[32px] backdrop-blur-2xl border border-white/10 shadow-lg">
            
            {/* Class Selection */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Class Unit</span>
              <select 
                disabled={isClassSelectorLocked}
                value={classLevel} 
                onChange={(e) => onClassChange(e.target.value as ClassLevel)}
                className={`px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none transition-all shadow-sm ${
                  isClassSelectorLocked 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                    : 'bg-white text-slate-900 focus:ring-4 focus:ring-indigo-400/30'
                }`}
              >
                {accessibleClasses.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
              </select>
            </div>

            {/* Subject Selection */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Focus Subject</span>
              <select 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value as keyof StudentMarks)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {editableSubjects.map(sub => <option key={sub.key} value={sub.key}>{sub.label}</option>)}
              </select>
            </div>

            {/* Exam Type Selection */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-300 ml-1 mb-1.5 opacity-80">Exam Category</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-sm"
              >
                {Object.values(ExamType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="h-12 w-px bg-white/10 mx-1 hidden sm:block"></div>

            {/* Max Marks Display */}
            <div className="flex flex-col items-center justify-center bg-white/10 px-6 py-2 rounded-2xl border border-white/20">
              <span className="text-[8px] font-black uppercase text-indigo-200 mb-0.5">Scale Max</span>
              <span className="text-2xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Modern Interactive Table */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#fcfdfe]">
        {editableSubjects.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200 text-4xl shadow-inner border border-slate-100">
              <i className="fa-solid fa-user-lock"></i>
            </div>
            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Access Policy Restriction</h3>
            <p className="text-slate-400 text-xs mt-2 font-bold opacity-70">Contact Administrator to assign {selectedSubjectConfig?.label || 'Subject'} to your profile.</p>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-20">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-7 border-b border-slate-100">Roll</th>
                <th className="px-8 py-7 border-b border-slate-100">Student Identity</th>
                <th className="px-8 py-7 border-b border-slate-100">Guardian/Father</th>
                <th className="px-8 py-7 border-b border-slate-100 text-center w-56">Assessment (/ {currentMax})</th>
                <th className="px-10 py-7 border-b border-slate-100 text-center">Commit State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student, idx) => {
                const isOverLimit = parseInt(localMarks[student.id] || '0') > currentMax;
                const isPending = rowStatus[student.id] === 'Pending';
                
                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/40 transition-all duration-200 group`}>
                    <td className="px-10 py-6">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-black text-xs shadow-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {student.rollNo}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:text-indigo-900 transition-colors">{student.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID REF: {student.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500 uppercase italic opacity-70">
                        {student.fatherName || 'Data Missing'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-[140px]">
                          <input 
                            type="text"
                            value={localMarks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className={`w-full p-3.5 text-center rounded-[20px] font-black text-xl shadow-sm border-2 transition-all outline-none ${
                              isOverLimit 
                                ? 'border-red-500 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100' 
                                : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50'
                            }`}
                            placeholder="-"
                          />
                          {isOverLimit && (
                            <div className="absolute -top-3 -right-3 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs animate-bounce shadow-xl border-4 border-white">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        {isPending ? (
                          <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 animate-pulse flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                            Pending
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                             Committed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 🛠 Footer Actions Console */}
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                {i}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {students.length} Records Loaded • Buffered Buffer Active
          </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-all"
          >
            Exit Portal
          </button>
          <button 
            onClick={handleCommit}
            disabled={editableSubjects.length === 0}
            className="flex-1 sm:flex-none px-14 py-4 bg-slate-900 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0.5 transition-all disabled:opacity-20 disabled:grayscale"
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