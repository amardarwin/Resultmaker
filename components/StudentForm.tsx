
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
      classLevel,
      marks: finalMarks as StudentMarks,
      manualTotal: manualTotal !== '' ? parseInt(manualTotal) : undefined
    };

    onAdd(student);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">
        {editStudent ? 'Update Record' : 'Manual Data Entry'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Class Level</label>
            <select value={classLevel} onChange={(e) => setClassLevel(e.target.value as ClassLevel)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              {ALL_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Roll Number</label>
            <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="001" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Student Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
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

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Override Calculated Total (Optional)</label>
            <input 
              type="number" 
              value={manualTotal} 
              onChange={(e) => setManualTotal(e.target.value)} 
              placeholder="Leave blank for auto-calc"
              className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="mt-2 text-[10px] text-indigo-400 font-bold uppercase">If you enter a value here, the system will use this instead of summing the subject marks.</p>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button type="submit" className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
            {editStudent ? 'UPDATE RECORD' : 'SAVE STUDENT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
