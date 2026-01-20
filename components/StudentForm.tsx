
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

  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);

  useEffect(() => {
    if (!editStudent) {
      // Clear marks when switching class for a new entry to avoid cross-schema contamination
      setMarks({});
    }
  }, [classLevel, editStudent]);

  const handleMarkChange = (key: keyof StudentMarks, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0));
    setMarks(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !name) return alert('Please fill in Roll No and Name');

    // Ensure all required marks are present (default to 0)
    const finalMarks: any = {};
    subjects.forEach(sub => {
      finalMarks[sub.key] = marks[sub.key] || 0;
    });

    const student: Student = {
      id: editStudent?.id || Date.now().toString(),
      rollNo,
      name,
      classLevel,
      marks: finalMarks as StudentMarks
    };

    onAdd(student);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">
        {editStudent ? 'Edit Student Record' : 'Enter New Marks'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              disabled={!!editStudent}
            >
              {ALL_CLASSES.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Roll No</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 101"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Subject Marks (Max 100)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {subjects.map(sub => (
              <div key={sub.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {sub.label} {sub.type === 'GRADING' && <span className="text-orange-500 font-bold">(G)</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marks[sub.key] ?? ''}
                  onChange={(e) => handleMarkChange(sub.key, e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 outline-none transition-all ${
                    sub.type === 'GRADING' ? 'bg-orange-50 border-orange-200 focus:ring-orange-500' : 'bg-white border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium"
          >
            {editStudent ? 'Update Record' : 'Save Result'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
