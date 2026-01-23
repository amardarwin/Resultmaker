// FILE: src/components/SubjectEntryForm.tsx

import React, { useState, useEffect } from 'react';

// --- SAFE MODE: No External Imports to prevent crashes ---
interface Props {
  currentUser: any; 
}

const SubjectEntryForm: React.FC<Props> = ({ currentUser }) => {
  // Safe Defaults
  const defaultClass = currentUser?.assignedClass || '10th';
  const userRole = currentUser?.role || 'SUBJECT_TEACHER';

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  
  // ✅ YAHAN HAI "EXAM TYPE" (Default: Bimonthly)
  const [examType, setExamType] = useState<string>('bimonthly');
  
  const [students, setStudents] = useState<any[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(20);

  // 1. Data Load
  useEffect(() => {
    const savedData = localStorage.getItem('student_data');
    if (savedData) {
      try {
        const allStudents = JSON.parse(savedData);
        const classStudents = allStudents.filter((s: any) => 
          (s.class === selectedClass) || (s.className === selectedClass)
        );
        setStudents(classStudents);
      } catch (e) {
        console.error("Error", e);
      }
    }
  }, [selectedClass]);

  // 2. Exam Rules (Bimonthly = 20, Term = 80)
  useEffect(() => {
    let limit = 100;
    if (examType === 'bimonthly') {
      limit = 20;
    } else if (examType === 'term' || examType === 'preboard') {
      limit = 80;
    } else if (examType === 'final') {
      if (['pbi_a', 'pbi_b'].includes(selectedSubject)) {
        limit = 75;
      } else {
        limit = 100;
      }
    }
    setMaxMarks(limit);
  }, [examType, selectedSubject]);

  // 3. Save Logic
  const handleMarkChange = (rollNo: string, value: string) => {
    const numValue = parseFloat(value);
    
    // Check Max Marks
    if (value !== '' && !isNaN(numValue) && numValue > maxMarks) {
      alert(`STOP! Marks cannot be more than ${maxMarks} for ${examType}!`);
      return;
    }

    const storageKey = `${examType}_${selectedSubject}`;

    const updatedStudents = students.map(s => 
      s.rollNo === rollNo ? { ...s, [storageKey]: value } : s
    );
    setStudents(updatedStudents);

    const allData = JSON.parse(localStorage.getItem('student_data') || '[]');
    const updatedAllData = allData.map((s: any) => {
      if (s.rollNo === rollNo && (s.class === selectedClass || s.className === selectedClass)) {
        return { ...s, [storageKey]: value }; 
      }
      return s;
    });
    localStorage.setItem('student_data', JSON.stringify(updatedAllData));
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600 mb-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📝 Assessment Entry Portal</h2>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
            System Online
          </span>
        </div>
        
        {/* --- CONTROLS SECTION (Yahan Dropdowns Hain) --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          
          {/* 1. EXAM TYPE SELECTOR (New Feature) */}
          <div className="relative">
            <label className="block text-xs font-bold text-indigo-700 uppercase mb-1 tracking-wider">
              Step 1: Select Exam Type
            </label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full p-3 border-2 border-indigo-500 bg-white rounded-md font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 shadow-sm"
            >
              <option value="bimonthly">🟢 Bimonthly (20 Marks)</option>
              <option value="term">🔵 Term Exam (80 Marks)</option>
              <option value="preboard">🟣 Preboard (80 Marks)</option>
              <option value="final">🔴 Final Exam (100/75)</option>
            </select>
          </div>

          {/* 2. CLASS SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Step 2: Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={userRole === 'CLASS_INCHARGE'}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700"
            >
              {['6th', '7th', '8th', '9th', '10th'].map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* 3. SUBJECT SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Step 3: Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700"
            >
              <option value="math">Mathematics</option>
              <option value="sci">Science</option>
              <option value="eng">English</option>
              <option value="sst">Social Studies</option>
              <option value="hindi">Hindi</option>
              <option value="pbi">Punjabi (Gen)</option>
              <option value="pbi_a">Punjabi A</option>
              <option value="pbi_b">Punjabi B</option>
              <option value="comp">Computer Science</option>
              <option value="phy_edu">Physical Education</option>
              <option value="agri">Agriculture</option>
              <option value="drawing">Drawing</option>
              <option value="welcome_life">Welcome Life</option>
            </select>
          </div>

          {/* 4. MAX MARKS INDICATOR */}
          <div className="flex items-end">
            <div className="w-full p-3 bg-indigo-100 border border-indigo-200 rounded-md text-center">
              <span className="block text-xs text-indigo-600 font-bold uppercase">Max Marks</span>
              <span className="text-2xl font-black text-indigo-900">{maxMarks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENTS LIST */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
              <th className="p-4">Roll No</th>
              <th className="p-4">Student Name</th>
              <th className="p-4 w-40">Marks Obtained</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length > 0 ? (
              students.map((student) => {
                const key = `${examType}_${selectedSubject}`;
                const val = student[key] || ''; 
                return (
                  <tr key={student.rollNo} className="hover:bg-indigo-50 transition-all">
                    <td className="p-4 font-bold text-gray-700">{student.rollNo}</td>
                    <td className="p-4 font-semibold text-gray-800">{student.name}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={val}
                        onChange={(e) => handleMarkChange(student.rollNo, e.target.value)}
                        className={`w-full p-2 border-2 rounded-md text-center font-bold text-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 
                          ${val !== '' && parseFloat(val) > maxMarks ? 'border-red-500 bg-red-100 text-red-700' : 'border-indigo-100 focus:border-indigo-500'}`}
                        placeholder="-"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  Select Class to see students.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
