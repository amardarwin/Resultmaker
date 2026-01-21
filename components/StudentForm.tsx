
import React, { useState, useEffect } from 'react';
import { ClassLevel, Student, StudentMarks } from '../types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from '../constants';

interface StudentFormProps {
  onAdd: (student: Student) => void;
  onCancel: () => void;
  editStudent?: Student;
}

const StudentForm: React.FC<StudentFormProps> = ({ onAdd, onCancel, editStudent }) => {
  const [classLevel, setClassLevel] = useState<ClassLevel>(editStudent?.classLevel || '6');
  const [rollNo, setRollNo] = useState(editStudent?.rollNo || '');
  const [name, setName] = useState(editStudent?.name || '');
  const [password, setPassword] = useState(editStudent?.password || '1234');
  const [marks, setMarks] = useState<Partial<StudentMarks>>(editStudent?.marks || {});
  const [manualTotal, setManualTotal] = useState<string>(editStudent?.manualTotal?.toString() || '');

  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);

  const handleMarkChange = (key: keyof StudentMarks, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    setMarks(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !name) return alert('Please fill in Roll No and Name');

    const finalMarks: any = {};
    subjects.forEach(sub => {
      finalMarks[sub.key] = marks[sub.key] || 0;
    });

    const student: Student = {
      id: editStudent?.id || Date.now().toString(),
      rollNo,
      name,
      password, // Save custom password
      classLevel,
      marks: finalMarks as StudentMarks,
      manualTotal: manualTotal !== '' ? parseInt(manualTotal) : undefined
    };

    onAdd(student);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800">
          {editStudent ? 'Update Student Profile' : 'New Enrollment'}
        </h2>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
           <i className="fa-solid fa-key text-indigo-400 text-xs"></i>
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Auth Active</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Class Level</label>
            <select value={classLevel} onChange={(e) => setClassLevel(e.target.value as ClassLevel)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
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
          <div>
            <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Portal Password</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: 1234" className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Marks</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {subjects.map(sub => (
              <div key={sub.key}>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  {sub.label} {sub.type === 'GRADING' && ' (G)'}
                </label>
                <input
                  type="number"
                  value={marks[sub.key] ?? ''}
                  onChange={(e) => handleMarkChange(sub.key, e.target.value)}
                  className={`w-full p-2.5 border rounded-lg font-bold text-center outline-none transition-all ${sub.type === 'GRADING' ? 'bg-orange-50 border-orange-200 focus:ring-orange-500' : 'bg-white border-slate-200 focus:ring-indigo-500'}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Override Calculated Total (Optional)</label>
            <input 
              type="number" 
              value={manualTotal} 
              onChange={(e) => setManualTotal(e.target.value)} 
              placeholder="Leave blank for auto-summing main subjects"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              If defined, this value will be used as the final Total for ranking and percentage calculation, ignoring the subject mark sum.
            </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all uppercase text-xs">Cancel</button>
          <button type="submit" className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase text-xs tracking-wider">
            {editStudent ? 'Update Enrollment' : 'Save Enrollment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
