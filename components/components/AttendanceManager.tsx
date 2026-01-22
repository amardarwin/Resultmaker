import React, { useState, useEffect } from 'react';
import { Student, ClassLevel, AttendanceRecord, AttendanceStatus, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceManagerProps {
  classLevel: ClassLevel;
  students: Student[];
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ classLevel, students }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load attendance for the date/class
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const record = saved.find(r => r.date === selectedDate && r.classLevel === classLevel);
    
    if (record) {
      setAttendance(record.records);
      setIsSaved(true);
    } else {
      // Default all to Present
      const defaultState: Record<string, AttendanceStatus> = {};
      students.forEach(s => defaultState[s.rollNo] = 'P');
      setAttendance(defaultState);
      setIsSaved(false);
    }
  }, [selectedDate, classLevel, students]);

  const toggleStatus = (rollNo: string) => {
    setAttendance(prev => {
      const current = prev[rollNo] || 'P';
      let next: AttendanceStatus = 'P';
      if (current === 'P') next = 'A';
      else if (current === 'A') next = 'L';
      else next = 'P';
      
      return { ...prev, [rollNo]: next };
    });
    setIsSaved(false);
  };

  const saveAttendance = () => {
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const existingIdx = saved.findIndex(r => r.date === selectedDate && r.classLevel === classLevel);
    
    const newRecord: AttendanceRecord = {
      date: selectedDate,
      classLevel,
      records: attendance
    };

    if (existingIdx > -1) {
      saved[existingIdx] = newRecord;
    } else {
      saved.push(newRecord);
    }

    localStorage.setItem('attendance_records', JSON.stringify(saved));
    setIsSaved(true);
    alert('Attendance saved successfully!');
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch(status) {
      case 'P': return 'bg-emerald-500 text-white';
      case 'A': return 'bg-red-500 text-white';
      case 'L': return 'bg-orange-500 text-white';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const isClassIncharge = user?.role === Role.ADMIN || (user?.role === Role.CLASS_INCHARGE && user.assignedClass === classLevel);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Attendance Registry</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class {classLevel} • {students.length} Students</p>
        </div>
        
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-3 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-500 transition-all bg-slate-50"
          />
          {isClassIncharge && (
            <button 
              onClick={saveAttendance}
              disabled={isSaved}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              <i className={`fa-solid ${isSaved ? 'fa-check-double' : 'fa-save'} mr-2`}></i>
              {isSaved ? 'SAVED' : 'COMMIT REGISTRY'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Roll No</th>
              <th className="px-8 py-6">Student Name</th>
              <th className="px-8 py-6 text-center">Status Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-300 italic">No students found for this class.</td></tr>
            ) : (
              students.map(s => (
                <tr key={s.rollNo} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-500">{s.rollNo}</td>
                  <td className="px-8 py-5 font-black text-slate-800">{s.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <button 
                        disabled={!isClassIncharge}
                        onClick={() => toggleStatus(s.rollNo)}
                        className={`w-32 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${getStatusColor(attendance[s.rollNo] || 'P')}`}
                      >
                        {attendance[s.rollNo] === 'P' ? 'Present' : attendance[s.rollNo] === 'A' ? 'Absent' : 'Leave'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!isClassIncharge && (
        <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl text-orange-800 text-xs font-bold text-center">
           <i className="fa-solid fa-lock mr-2"></i> Only the Class Incharge or Admin can modify attendance records.
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;