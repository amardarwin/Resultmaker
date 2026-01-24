
import React, { useState, useEffect } from 'react';
import { Student, ClassLevel, StudentMarks, Role } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { exportAwardList } from '../utils/export';
import { useAuth } from '../contexts/AuthContext';

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
