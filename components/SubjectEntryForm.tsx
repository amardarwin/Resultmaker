// FILE: components/SubjectEntryForm.tsx

import React, { useState, useEffect } from 'react';

// 🔥 UNIVERSAL INTERFACE: Yeh kisi bhi prop ko mana nahi karega.
// App.tsx kuch bhi bheje, yeh accept kar lega.
interface UniversalProps {
  currentUser?: any;
  [key: string]: any; // 👈 JAADU: Allow anything else passed by parent
}

const SubjectEntryForm: React.FC<UniversalProps> = (props) => {
  // Safe User Extraction
  const currentUser = props.currentUser || {};
  const defaultClass = currentUser?.assignedClass || '10th';
  const userRole = currentUser?.role || 'SUBJECT_TEACHER';

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  
  // ✅ EXAM TYPE IS HERE
  const [examType, setExamType] = useState<string>('bimonthly');
  
  const [students, setStudents] = useState<any[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(20);

  // 1. Data Load
  useEffect(() => {
    const savedData = localStorage.getItem('student_data');
    if (savedData) {
      try {
        const allStudents = JSON.parse(savedData);
        // Robust Filtering
        const classStudents = allStudents.filter((s: any) => 
          (s.class === selectedClass) || (s.className === selectedClass)
        );
        setStudents(classStudents);
      } catch (e) {
        console.error("Load Error", e);
      }
    }
  }, [selectedClass]);

  // 2. Exam Rules
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
    
    if (value !== '' && !isNaN(numValue) && numValue > maxMarks) {
      alert(`⚠️ marks cannot be more than ${maxMarks} for ${examType}!`);
      return;
    }

    const storageKey = `${examType}_${selectedSubject}`;

    const updatedStudents = students.map(s => 
      s.rollNo === rollNo ? { ...s, [storageKey]: value } : s
    );
    setStudents(updatedStudents);

    // Global Save
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
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Assessment Entry Portal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 1. EXAM TYPE (Sabse Pehle) */}
          <div className="relative">
            <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">
              Select Exam Type
            </label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full p-3 border-2 border-indigo-500 bg-indigo-50 rounded-md font-bold text-gray-900"
            >
              <option value="bimonthly">🟢 Bimonthly (20)</option>
              <option value="term">🔵 Term Exam (80)</option>
              <option value="preboard">🟣 Preboard (80)</option>
              <option value="final">🔴 Final Exam (100)</option>
            </select>
          </div>

          {/* 2. CLASS */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={userRole === 'CLASS_INCHARGE'}
              className="w-full p-3 border rounded-md"
            >
              {['6th', '7th', '8th', '9th', '10th'].map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* 3. SUBJECT */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 border rounded-md"
            >
              <option value="math">Mathematics</option>
              <option value="sci">Science</option>
              <option value="eng">English</option>
              <option value="sst">Social Studies</option>
              <option value="hindi">Hindi</option>
              <option value="pbi">Punjabi</option>
              <option value="pbi_a">Punjabi A</option>
              <option value="pbi_b">Punjabi B</option>
              <option value="comp">Computer Science</option>
              <option value="phy_edu">Physical Education</option>
              <option value="agri">Agriculture</option>
              <option value="drawing">Drawing</option>
              <option value="welcome_life">Welcome Life</option>
            </select>
          </div>

          {/* 4. MAX MARKS */}
          <div className="flex items-end">
            <div className="w-full p-3 bg-indigo-100 border border-indigo-200 rounded-md text-center">
              <span className="block text-xs text-indigo-600 font-bold uppercase">Max Marks</span>
              <span className="text-2xl font-black text-indigo-900">{maxMarks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Roll No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Marks</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => {
                const key = `${examType}_${selectedSubject}`;
                const val = student[key] || ''; 
                return (
                  <tr key={student.rollNo} className="border-b">
                    <td className="p-4 font-bold">{student.rollNo}</td>
                    <td className="p-4">{student.name}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => handleMarkChange(student.rollNo, e.target.value)}
                        className="p-2 border rounded font-bold w-full"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No Data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectEntryForm;
