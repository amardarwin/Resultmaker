import React, { useState, useEffect, useMemo } from 'react';
import { CalculatedResult, Student, StudentMarks, ClassLevel, Role, AttendanceRecord, HomeworkTask, ExamType } from '../types';
import { getPerformanceBands, calculateSubjectStats, getComparativeSubjectStats } from '../utils/calculations';
import { useAuth } from '../contexts/AuthContext';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS, getExamMaxMarks, getMarkKey } from '../constants';

interface DashboardProps {
  results: CalculatedResult[];
  allStudents: Student[];
  className: string;
  onClassChange?: (cls: ClassLevel) => void;
  onNavigate: (view: any) => void;
  examType: ExamType;
  activeFilters: { subject: keyof StudentMarks | null, band: string | null };
  onSubjectClick: (subject: keyof StudentMarks) => void;
  onBandClick: (band: string) => void;
  onClearFilters: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  results, 
  allStudents,
  className, 
  onClassChange,
  onNavigate,
  examType,
  activeFilters,
  onSubjectClick,
  onBandClick,
  onClearFilters
}) => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<number>(100);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [comparativeSubject, setComparativeSubject] = useState<keyof StudentMarks>('hindi');

  useEffect(() => {
    const savedAttendance: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const record = savedAttendance.find(a => a.date === today && a.classLevel === className);
    
    if (record) {
      const presentCount = Object.values(record.records).filter(s => s === 'P' || s === 'L').length;
      const total = Object.keys(record.records).length;
      setTodayAttendance(total > 0 ? Math.round((presentCount / total) * 100) : 100);
    } else {
      setTodayAttendance(100);
    }

    const tasks: HomeworkTask[] = JSON.parse(localStorage.getItem('homework_tasks') || '[]');
    const classTasks = tasks.filter(t => t.classLevel === className && t.status !== 'Completed');
    setPendingTasks(classTasks.length);
  }, [className]);

  const stats = [
    { label: 'Students', value: results.length, icon: 'fa-users', color: 'bg-indigo-600', sub: `Class ${className} Total` },
    { label: 'Attendance', value: `${todayAttendance}%`, icon: 'fa-calendar-check', color: 'bg-emerald-500', sub: 'Status: Today' },
    { label: 'Tasks', value: pendingTasks, icon: 'fa-list-check', color: 'bg-orange-500', sub: 'Homework / Pending' },
    { label: 'Pass Rate', value: results.length > 0 ? `${Math.round((results.filter(r => r.status === 'Pass').length / results.length) * 100)}%` : '0%', icon: 'fa-chart-pie', color: 'bg-blue-600', sub: 'Academic Health' },
  ];

  const handlePortalNavigate = (cls: ClassLevel) => {
    if (onClassChange) onClassChange(cls);
    onClearFilters();
  };

  const bands = getPerformanceBands(results);
  const subjectStats = calculateSubjectStats(results, className, examType);
  const compStats = getComparativeSubjectStats(allStudents, comparativeSubject, examType);

  const allAvailableSubjects = useMemo(() => {
    const set = new Set<string>();
    ALL_CLASSES.forEach(cls => {
      GET_SUBJECTS_FOR_CLASS(cls).forEach(s => set.add(s.key as string));
    });
    return Array.from(set);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER PORTAL */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Systems Dashboard</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Class {className} Command Center</p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {user?.assignedClass && (
            <button 
              onClick={() => handlePortalNavigate(user.assignedClass!)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${className === user.assignedClass ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              My Class ({user.assignedClass})
            </button>
          )}
          {user?.teachingAssignments?.filter(a => a.classLevel !== user.assignedClass).map(a => (
            <button 
              key={a.classLevel}
              onClick={() => handlePortalNavigate(a.classLevel)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${className === a.classLevel ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Teaching: {a.classLevel}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
               <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                 <i className={`fa-solid ${s.icon} text-xl`}></i>
               </div>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">{s.value}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-slate-800">Performance Bands</h3>
             <button onClick={onClearFilters} className="text-[10px] font-black text-indigo-500 uppercase">Reset Filters</button>
           </div>
           <div className="space-y-4">
              {bands.map((band, idx) => (
                <button 
                  key={idx} 
                  onClick={() => onBandClick(band.range)}
                  className={`w-full text-left space-y-1.5 p-3 rounded-2xl transition-all ${activeFilters.band === band.range ? 'bg-indigo-50 ring-2 ring-indigo-500 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{band.range}</span>
                    <span className="text-slate-800">{band.count} Students</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${results.length > 0 ? (band.count / results.length) * 100 : 0}%`, 
                        backgroundColor: band.color 
                      }}
                    ></div>
                  </div>
                </button>
              ))}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-slate-800">Subject Insights</h3>
             <button onClick={onClearFilters} className="text-[10px] font-black text-indigo-500 uppercase">Clear Focus</button>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {subjectStats.map(sub => {
               const maxMarks = getExamMaxMarks(examType, sub as any);
               const mKey = getMarkKey(examType, sub.key);
               const atRiskCount = results.filter(r => ((r.marks[mKey] || 0) / maxMarks) * 100 < 40).length;
               const isSelected = activeFilters.subject === sub.key;
               
               return (
                 <button 
                  key={sub.key} 
                  onClick={() => onSubjectClick(sub.key)}
                  className={`p-4 rounded-3xl border transition-all text-left group relative overflow-hidden ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-100'}`}
                 >
                   <div className="flex justify-between items-start">
                    <div className={`text-[9px] font-black uppercase mb-1 ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>{sub.label}</div>
                   </div>
                   <div className="text-xl font-black">{sub.avg}</div>
                   <div className={`text-[8px] font-bold uppercase mt-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {atRiskCount} At-Risk (<40%)
                   </div>
                 </button>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
