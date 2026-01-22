// FILE: src/components/SubjectEntryForm.tsx

import React, { useState, useEffect } from 'react';

// --- RULES YAHIN LIKH DIYE (IMPORT KI ZAROORAT NAHI) ---
interface Student {
  id: number;
  rollNo: string;
  name: string;
  fatherName: string;
  motherName?: string;
  category?: string;
  dob?: string;
  className?: string; 
  class?: string;

  // Subjects
  pbi?: string | number;
  math?: string | number;
  sci?: string | number;
  sst?: string | number;
  eng?: string | number;
  hindi?: string | number;

  // Grading
  comp?: string | number;
  phy_edu?: string | number;
  drawing?: string | number;
  agri?: string | number;
  welcome_life?: string | number;

  // ✨ MAGIC LINE (Allow everything)
  [key: string]: any;
}

interface User {
  username: string;
  role: 'ADMIN' | 'CLASS_INCHARGE' | 'SUBJECT_TEACHER' | 'STUDENT';
  name: string;
  assignedClass?: string;
  teachingAssignments?: { class: string, subjects: string[] }[];
}

interface SubjectEntryFormProps {
  currentUser: User;
}
// -------------------------------------------------------

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ currentUser }) => {
  const [selectedClass, setSelectedClass] = useState<string>(currentUser.assignedClass || '10th');
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [examType, setExamType] = useState<string>('bimonthly');
  const [students, setStudents] = useState<Student[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(20);

  // 1. Load Students
  useEffect(() => {
    const savedData = localStorage.getItem('student_data');
    if (savedData) {
      try {
        const allStudents: Student[] = JSON.parse(savedData);
        const classStudents = allStudents.filter((s: any) => 
          (s.class === selectedClass) || (s.className === selectedClass)
        );
        setStudents(classStudents);
      } catch (e) {
        console.error("Error loading students", e);
      }
    }
  }, [selectedClass]);

  // 2. Max Marks Logic
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

  // 3. Handle Save
  const handleMarkChange = (rollNo: string, value: string) => {
    const numValue = parseFloat(value);
    if (value !== '' && numValue > maxMarks) {
      alert(`Error: Marks cannot be more than ${maxMarks} for ${examType} exam!`);
      return;
    }

    const storageKey = `${examType}_${selectedSubject}`;

    // Update Local State
    const updatedStudents = students.map(s => 
      s.rollNo === rollNo ? { ...s, [storageKey]: value } : s
    );
    setStudents(updatedStudents);

    // Update GLOBAL Storage
    const allData = JSON.parse(localStorage.getItem('student_data') || '[]');
    const updatedAllData = allData.map((s: Student) => {
      if (s.rollNo === rollNo && (s.class === selectedClass || s.className === selectedClass)) {
        return { ...s, [storageKey]: value }; 
      }
      return s;
    });
    localStorage.setItem('student_data', JSON.stringify(updatedAllData));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Assessment Entry Portal</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Class */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={currentUser.role === 'CLASS_INCHARGE'}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100"
            >
              <option value="6th">Class 6</option>
              <option value="7th">Class 7</option>
              <option value="8th">Class 8</option>
              <option value="9th">Class 9</option>
              <option value="10th">Class 10</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
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

          {/* EXAM TYPE */}
          <div>
            <label className="block text-sm font-semibold text-indigo-700 mb-1">Exam Type</label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full p-2 border-2 border-indigo-100 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="bimonthly">Bimonthly (20)</option>
              <option value="term">Term Exam (80)</option>
              <option value="preboard">Preboard (80)</option>
              <option value="final">Final Exam (100/75)</option>
            </select>
          </div>

          {/* Max Marks */}
          <div className="flex items-end pb-2">
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-bold w-full text-center border border-indigo-200">
              Max Marks: {maxMarks}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-4 border-b">Roll No</th>
              <th className="p-4 border-b">Student Name</th>
              <th className="p-4 border-b">Father's Name</th>
              <th className="p-4 border-b w-40">Marks (Out of {maxMarks})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length > 0 ? (
              students.map((student) => {
                const key = `${examType}_${selectedSubject}`;
                const val = student[key] || ''; 
                return (
                  <tr key={student.rollNo} className="hover:bg-indigo-50 transition-colors">
                    <td className="p-4 font-medium text-gray-700">{student.rollNo}</td>
                    <td className="p-4 font-semibold text-gray-800">{student.name}</td>
                    <td className="p-4 text-gray-500">{student.fatherName}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={val}
                        onChange={(e) => handleMarkChange(student.rollNo, e.target.value)}
                        className={`w-full p-2 border rounded-md text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 
                          ${val !== '' && parseFloat(val) > maxMarks ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300'}`}
                        placeholder="--"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No students found in {selectedClass}. Please enroll students first.
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
