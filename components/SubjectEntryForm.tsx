import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassLevel, StudentMarks, Role, ExamType, SubjectConfig } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';

interface SubjectEntryFormProps {
  classLevel: ClassLevel;
  students: Student[];
  onSave: (updatedStudents: Student[]) => void;
  onCancel: () => void;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
}

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ 
  classLevel, 
  students, 
  onSave, 
  onCancel,
  examType,
  onExamTypeChange
}) => {
  const { user, canEditSubject } = useAuth();
  
  // 1. Logic Setup: Subject & Permissions
  const allClassSubjects = GET_SUBJECTS_FOR_CLASS(classLevel);
  const editableSubjects = useMemo(() => 
    allClassSubjects.filter(s => canEditSubject(s.key, classLevel)),
    [allClassSubjects, canEditSubject, classLevel]
  );

  const [selectedSubjectKey, setSelectedSubjectKey] = useState<keyof StudentMarks>(() => {
    return editableSubjects.length > 0 ? editableSubjects[0].key : allClassSubjects[0].key;
  });

  const selectedSubjectConfig = allClassSubjects.find(s => s.key === selectedSubjectKey)!;
  const currentMax = getExamMaxMarks(examType, selectedSubjectConfig);
  const storageKey = getMarkKey(examType, selectedSubjectKey as string);

  // 2. State Management for Inputs
  const [localMarks, setLocalMarks] = useState<{ [studentId: string]: string }>({});
  const [status, setStatus] = useState<{ [studentId: string]: 'Saved' | 'Pending' }>({});

  // Initialize data when subject or exam type changes
  useEffect(() => {
    const initialMarks: { [id: string]: string } = {};
    const initialStatus: { [id: string]: 'Saved' | 'Pending' } = {};
    
    students.forEach(s => {
      const val = s.marks[storageKey];
      initialMarks[s.id] = val !== undefined ? val.toString() : '';
      initialStatus[s.id] = 'Saved';
    });
    
    setLocalMarks(initialMarks);
    setStatus(initialStatus);
  }, [selectedSubjectKey, examType, students, storageKey]);

  const handleMarkChange = (studentId: string, value: string) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    setStatus(prev => ({ ...prev, [studentId]: 'Pending' }));
  };

  const handleSave = () => {
    // Permission check
    if (!canEditSubject(selectedSubjectKey, classLevel)) {
      alert("❌ Access Denied: Insufficient permissions.");
      return;
    }

    // Validation check
    const invalidStudents = students.filter(s => {
      const mark = parseInt(localMarks[s.id] || '0');
      return mark > currentMax;
    });

    if (invalidStudents.length > 0) {
      alert(`⚠️ Validation Error: ${invalidStudents.length} entry(s) exceed the Max Marks (${currentMax}) for ${examType} exams.`);
      return;
    }

    // Construct updated student list
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
    
    // Update local status
    const savedStatus: { [id: string]: 'Saved' | 'Pending' } = {};
    students.forEach(s => savedStatus[s.id] = 'Saved');
    setStatus(savedStatus);
    
    alert("✅ Marks saved successfully to secure storage.");
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* 📝 Header Section */}
      <div className="p-8 bg-gradient-to-r from-indigo-600 to-violet-700 text-white relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <i className="fa-solid fa-file-signature text-xl"></i>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Assessment Entry Portal</h2>
            </div>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">
              Class {classLevel} • {editableSubjects.length} Focus Subject(s) Available
            </p>
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-3 bg-black/10 p-4 rounded-[28px] backdrop-blur-lg border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Exam Stage</span>
              <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {Object.values(ExamType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-indigo-200 ml-1 mb-1">Subject</span>
              <select 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value as keyof StudentMarks)}
                className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {editableSubjects.map(sub => <option key={sub.key} value={sub.key}>{sub.label}</option>)}
              </select>
            </div>

            <div className="h-10 w-px bg-white/20 mx-1 hidden sm:block"></div>

            <div className="flex flex-col items-center justify-center bg-white/10 px-4 py-1.5 rounded-2xl border border-white/10">
              <span className="text-[8px] font-black uppercase text-indigo-100">Max Score</span>
              <span className="text-xl font-black leading-none">{currentMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Data Entry Table */}
      <div className="max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#fcfdfe]">
        {editableSubjects.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 text-4xl">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Entry Restricted</h3>
            <p className="text-slate-400 text-xs mt-2 font-medium">You are not assigned to Class {classLevel} for this assessment.</p>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-20">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6 border-b border-slate-100">Roll No</th>
                <th className="px-8 py-6 border-b border-slate-100">Student Identity</th>
                <th className="px-8 py-6 border-b border-slate-100">Father's Name</th>
                <th className="px-8 py-6 border-b border-slate-100 text-center w-48">Score Entry</th>
                <th className="px-8 py-6 border-b border-slate-100 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student, idx) => {
                const isInvalid = parseInt(localMarks[student.id] || '0') > currentMax;
                const isPending = status[student.id] === 'Pending';
                
                return (
                  <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/30 transition-all duration-200 group`}>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-black text-xs">
                        {student.rollNo}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{student.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Class ID: {student.id.slice(-4)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-500 uppercase italic">
                        {student.fatherName || 'Not Recorded'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-[120px]">
                          <input 
                            type="text"
                            value={localMarks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className={`w-full p-3 text-center rounded-2xl font-black text-lg shadow-sm border-2 transition-all outline-none ${
                              isInvalid 
                                ? 'border-red-400 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100' 
                                : 'border-slate-100 bg-white text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                            }`}
                            placeholder="0"
                          />
                          {isInvalid && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce shadow-lg">
                              !
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                          isPending 
                            ? 'bg-amber-100 text-amber-600 animate-pulse' 
                            : 'bg-emerald-100 text-emerald-600'
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
        )}
      </div>

      {/* 🛠 Footer Actions */}
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {students.length} Students Active In Current Buffer
          </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={editableSubjects.length === 0}
            className="flex-1 sm:flex-none px-12 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            Commit To Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEntryForm;