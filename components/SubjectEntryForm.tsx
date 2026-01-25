import React, { useState, useEffect, useMemo } from 'react';

// ✅ Internal Types (Taaki bahar se kuch import na karna pade)
type ClassLevel = '6th' | '7th' | '8th' | '9th' | '10th';

interface SubjectEntryFormProps {
  students?: any[]; // Optional taaki error na aaye
  onSave?: (students: any[]) => void;
  onCancel?: () => void;
  currentUser: any;
}

const SubjectEntryForm: React.FC<SubjectEntryFormProps> = ({ 
  students = [], 
  onSave, 
  onCancel,
  currentUser,
}) => {
  
  // 1. Local State
  // Agar currentUser data nahi aaya, toh default values use hongi taaki crash na ho
  const [selectedClass, setSelectedClass] = useState<string>(currentUser?.assignedClass || '10th');
  const [examType, setExamType] = useState<string>('bimonthly');
  const [selectedSubKey, setSelectedSubKey] = useState<string>('math');
  
  // Data State (LocalStorage support ke sath)
  const [allData, setAllData] = useState<any[]>(students);
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});

  // ✅ Auto-Load Data logic (Agar App.tsx ne empty list bheji)
  useEffect(() => {
    if (allData.length === 0) {
      const saved = localStorage.getItem('student_data');
      if (saved) {
        try {
          setAllData(JSON.parse(saved));
        } catch (e) {
          console.error("Data load error", e);
        }
      }
    }
  }, [allData.length]);

  // 2. DYNAMIC SUBJECT LIST
  const subjects = useMemo(() => {
    const cls = selectedClass;
    // 6th to 8th
    if (['6th', '7th', '8th'].includes(cls)) {
      return [
        { key: 'math', label: 'Mathematics' },
        { key: 'sci', label: 'Science' },
        { key: 'eng', label: 'English' },
        { key: 'sst', label: 'Social Studies' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'pbi', label: 'Punjabi' },
        { key: 'comp', label: 'Computer Science' },
        { key: 'phy_edu', label: 'Physical Education' },
        { key: 'agri', label: 'Agriculture' },
        { key: 'drawing', label: 'Drawing' },
        { key: 'welcome_life', label: 'Welcome Life' }
      ];
    }
    // 9th & 10th
    return [
      { key: 'math', label: 'Mathematics' },
      { key: 'sci', label: 'Science' },
      { key: 'eng', label: 'English' },
      { key: 'sst', label: 'Social Studies' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'pbi_a', label: 'Punjabi A' },
      { key: 'pbi_b', label: 'Punjabi B' },
      { key: 'comp', label: 'Computer Science' },
      { key: 'phy_edu', label: 'Physical Education' },
      { key: 'drawing', label: 'Drawing' },
      { key: 'welcome_life', label: 'Welcome Life' }
    ];
  }, [selectedClass]);

  // 3. MARKS LOGIC (65 Marks Rule Updated)
  const maxMarks = useMemo(() => {
    // Safe check: Agar examType undefined ho toh crash na kare
    const type = (examType || 'bimonthly').toLowerCase();
    const isPbi = selectedSubKey === 'pbi_a' || selectedSubKey === 'pbi_b';

    if (type === 'bimonthly') return 20;

    // Term/Preboard: Pbi=65, Others=80
    if (type === 'term' || type === 'preboard') {
      return isPbi ? 65 : 80;
    }

    // Final: Pbi=75, Others=100
    if (type === 'final') {
      return isPbi ? 75 : 100;
    }

    return 100;
  }, [examType, selectedSubKey]);

  // 4. PERMISSION LOGIC
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role;

    // A. Admin: Unlock All
    if (role === 'ADMIN') return true;

    // B. Class Incharge: Unlock Own Class
    if (role === 'CLASS_INCHARGE' && currentUser.assignedClass === selectedClass) {
      return true;
    }

    // C. Subject Teacher: Unlock Own Subject
    if (Array.isArray(currentUser.teachingSubjects)) {
      return currentUser.teachingSubjects.includes(selectedSubKey);
    }

    return false;
  }, [currentUser, selectedClass, selectedSubKey]);

  // Storage Key
  const storageKey = `${examType}_${selectedSubKey}`;

  // Load Marks
  useEffect(() => {
    const fresh: Record<string, string> = {};
    if (Array.isArray(allData)) {
      allData.forEach((s: any) => {
        if (s.class === selectedClass || s.className === selectedClass) {
          const val = s[storageKey];
          fresh[s.rollNo] = (val !== undefined && val !== null) ? String(val) : '';
        }
      });
    }
    setLocalMarks(fresh);
  }, [storageKey, allData, selectedClass]);

  // Input Handler
  const handleInputChange = (rollNo: string, val: string) => {
    if (!canEdit) return;
    if (val !== '' && !/^\d+$/.test(val)) return;
    setLocalMarks(prev => ({ ...prev, [rollNo]: val }));
  };

  // Save Function
  const handleCommit = () => {
    if (!canEdit) {
      alert("Access Denied: You don't have permission.");
      return;
    }

    const currentClassStudents = allData.filter((s:any) => s.class === selectedClass || s.className === selectedClass);
    
    // Check Limits
    for (const s of currentClassStudents) {
      const mark = parseInt(localMarks[s.rollNo] || '0');
      if (mark > maxMarks) {
        alert(`Error: Roll No ${s.rollNo} marks (${mark}) cannot be more than ${maxMarks}.`);
        return;
      }
    }

    // Save Logic
    const updatedStudents = allData.map((s: any) => {
      if ((s.class === selectedClass || s.className === selectedClass) && localMarks[s.rollNo] !== undefined) {
         const key = storageKey;
         return { ...s, [key]: localMarks[s.rollNo] };
      }
      return s;
    });

    setAllData(updatedStudents);
    localStorage.setItem('student_data', JSON.stringify(updatedStudents));
    
    if (onSave) onSave(updatedStudents);
    alert("Marks Saved Successfully!");
  };

  // Download Function
  const downloadAwardList = () => {
    const currentClassStudents = allData.filter((s:any) => s.class === selectedClass || s.className === selectedClass);
    
    if (currentClassStudents.length === 0) {
      alert("No students found.");
      return;
    }

    const headers = ['Roll No', 'Student Name', `Marks (Max: ${maxMarks})`];
    const rows = currentClassStudents.map((s:any) => [
      s.rollNo, 
      `"${s.name}"`, 
      localMarks[s.rollNo] || '0'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AwardList_${selectedClass}_${selectedSubKey}_${examType}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Subject Registry</h2>
            <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">
              {currentUser?.name || 'User'} ({currentUser?.role || 'Guest'})
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-black">
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 rounded-lg font-bold text-sm bg-indigo-50 border-2 border-indigo-200">
              {['6th','7th','8th','9th','10th'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>

            <select value={examType} onChange={e => setExamType(e.target.value)} className="px-3 py-2 rounded-lg font-bold text-sm bg-indigo-50 border-2 border-indigo-200">
              <option value="bimonthly">Bimonthly (20)</option>
              <option value="term">Term Exam (80/65)</option>
              <option value="preboard">Preboard (80/65)</option>
              <option value="final">Final (100/75)</option>
            </select>

            <select value={selectedSubKey} onChange={e => setSelectedSubKey(e.target.value)} className="px-3 py-2 rounded-lg font-bold text-sm bg-indigo-50 border-2 border-indigo-200 min-w-[120px]">
              {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            <div className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold border border-indigo-400">
              MM: {maxMarks}
            </div>
          </div>
        </div>
      </div>

      {/* Access Status */}
      {!canEdit ? (
        <div className="bg-gray-200 p-2 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-300">
          🔒 Read Only Mode: No Permission
        </div>
      ) : (
        <div className="bg-emerald-100 p-2 text-center text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-200">
           ✍️ Edit Mode Active
        </div>
      )}

      {/* Marks Table */}
      <div className="max-h-[60vh] overflow-auto bg-gray-50">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 shadow-sm z-10">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4">Roll No</th>
              <th className="p-4">Student Name</th>
              <th className="p-4 text-center">Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allData.filter((s:any) => s.class === selectedClass || s.className === selectedClass).length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-400">No students found in Class {selectedClass}</td></tr>
            ) : (
              allData.filter((s:any) => s.class === selectedClass || s.className === selectedClass).map((s:any) => {
                const val = localMarks[s.rollNo] || '';
                const isInvalid = parseInt(val) > maxMarks;
                return (
                  <tr key={s.rollNo} className="hover:bg-white transition-colors">
                    <td className="p-4 font-bold text-gray-600">{s.rollNo}</td>
                    <td className="p-4 font-bold text-gray-800">{s.name}</td>
                    <td className="p-4 text-center">
                      <input 
                        type="text" 
                        value={val}
                        disabled={!canEdit}
                        onChange={(e) => handleInputChange(s.rollNo, e.target.value)}
                        className={`w-24 p-2 text-center text-xl font-bold rounded border-2 outline-none transition-all
                          ${!canEdit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                            isInvalid ? 'bg-red-50 text-red-600 border-red-500' : 'bg-white border-indigo-100 focus:border-indigo-500 text-indigo-900'}
                        `}
                        placeholder="-"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Buttons */}
      <div className="p-4 bg-white border-t flex justify-between items-center">
        <button onClick={downloadAwardList} className="text-emerald-600 font-bold text-xs uppercase flex items-center gap-2 hover:bg-emerald-50 px-3 py-2 rounded">
          📥 Download CSV
        </button>
        <div className="flex gap-3">
          {onCancel && <button onClick={onCancel} className="px-6 py-2 text-gray-500 font-bold uppercase text-xs hover:bg-gray-100 rounded">Close</button>}
          <button 
            onClick={handleCommit} 
            disabled={!canEdit}
            className={`px-8 py-2 rounded-lg font-bold uppercase text-xs shadow-lg transform transition-all 
              ${canEdit ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}
            `}
          >
            Save Changes
          </button>
        </div>
      </div>

    </div>
  );
};

export default SubjectEntryForm;
