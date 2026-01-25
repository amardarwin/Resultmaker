import React, { useState, useEffect } from 'react';
import { ClassLevel, Student, StudentMarks, Role, ExamType } from '../types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS, getMarkKey } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface StudentFormProps {
  onAdd: (student: Student) => void;
  onCancel: () => void;
  editStudent?: Student;
  examType: ExamType;
}

const StudentForm: React.FC<StudentFormProps> = ({ onAdd, onCancel, editStudent, examType }) => {
  const { user } = useAuth();
  
  const initialClass = editStudent?.classLevel || 
    (user?.role === Role.CLASS_INCHARGE ? user.assignedClass : '6') || '6';

  const [classLevel, setClassLevel] = useState<ClassLevel>(initialClass as ClassLevel);
  const [rollNo, setRollNo] = useState(editStudent?.rollNo || '');
  const [name, setName] = useState(editStudent?.name || '');
  const [password, setPassword] = useState(editStudent?.password || '1234');
  
  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);

  const [marks, setMarks] = useState<Partial<StudentMarks>>(() => {
    const initial: Partial<StudentMarks> = {};
    subjects.forEach(sub => {
      const mKey = getMarkKey(examType, sub.key);
      initial[sub.key] = editStudent?.marks[mKey] || 0;
    });
    return initial;
  });
  
  const [manualTotal, setManualTotal] = useState<string>(editStudent?.manualTotal?.toString() || '');

  if (user?.role === Role.SUBJECT_TEACHER) {
    onCancel();
    return null;
  }

  const handleMarkChange = (key: keyof StudentMarks, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    setMarks(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !name) return alert('Please fill in Roll No and Name');

    const finalMarks: Record<string, number> = { ...(editStudent?.marks || {}) };
    subjects.forEach(sub => {
      const mKey = getMarkKey(examType, sub.key);
      finalMarks[mKey] = marks[sub.key] || 0;
    });

    const student: Student = {
      id: editStudent?.id || Date.now().toString(),
      rollNo,
      name,
      password,
      classLevel,
      marks: finalMarks,
      manualTotal: manualTotal !== '' ? parseInt(manualTotal) : undefined
    };

    onAdd(student);
  };

  const isClassLocked = user?.role === Role.CLASS_INCHARGE;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800">
          {editStudent ? 'Update Student Profile' : 'New Enrollment'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Class Level</label>
            <select 
              disabled={isClassLocked}
              value={classLevel} 
              onChange={(e) => setClassLevel(e.target.value as ClassLevel)} 
              className={`w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isClassLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
            >
              {ALL_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Roll Number</label>
            <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="001" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Student Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Marks ({examType})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {subjects.map(sub => (
              <div key={sub.key}>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{sub.label}</label>
                <input
                  type="number"
                  value={marks[sub.key] ?? ''}
                  onChange={(e) => handleMarkChange(sub.key, e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-bold text-center outline-none bg-white border-slate-200 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all uppercase text-xs">Cancel</button>
          <button type="submit" className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase text-xs tracking-wider">
            {editStudent ? 'Update Enrollment' : 'Save Enrollment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
