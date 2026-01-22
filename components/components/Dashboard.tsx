import React, { useState, useEffect } from 'react';
import { CalculatedResult, Student, StudentMarks, ClassLevel, Role, AttendanceRecord, HomeworkTask } from '../types';
import { getPerformanceBands, calculateSubjectStats } from '../utils/calculations';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  results: CalculatedResult[];
  allStudents: Student[];
  className: string;
  onClassChange?: (cls: ClassLevel) => void;
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  results, 
  allStudents,
  className, 
  onClassChange,
  onNavigate
}) => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<number>(100);
  const [pendingTasks, setPendingTasks] = useState<number>(0);

  useEffect(() => {
    // Calculate today's attendance for the selected class
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

    // Calculate pending homework tasks
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
  };

  const bands = getPerformanceBands(results);

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

      {/* STATS GRID */}
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

      {/* CHARTS & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trends */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-800">Attendance Trends</h3>
             <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">Last 7 Days</span>
           </div>
           
           <div className="h-48 flex items-end justify-between gap-4 px-2">
             {[65, 80, 75, 90, 85, 95, 100].map((val, i) => (
               <div key={i} className="flex-1 flex flex-col items-center group">
                 <div className="relative w-full">
                    <div 
                      className="w-full bg-slate-100 rounded-xl group-hover:bg-indigo-100 transition-all" 
                      style={{ height: '180px' }}
                    ></div>
                    <div 
                      className="absolute bottom-0 w-full bg-indigo-600 rounded-xl group-hover:bg-indigo-500 transition-all shadow-lg" 
                      style={{ height: `${val}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black">
                        {val}%
                      </div>
                    </div>
                 </div>
                 <span className="text-[9px] font-black text-slate-400 mt-3 uppercase">Day {i+1}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Action Center */}
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-xl font-black mb-2">Quick Actions</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">System-wide Automation</p>
               
               <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => onNavigate('attendance')} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                   <i className="fa-solid fa-calendar-plus text-emerald-400"></i> Mark Attendance
                 </button>
                 <button onClick={() => onNavigate('homework')} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                   <i className="fa-solid fa-file-signature text-orange-400"></i> New Homework Task
                 </button>
                 <button onClick={() => onNavigate('sheet')} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                   <i className="fa-solid fa-table-list text-indigo-400"></i> Generate Results
                 </button>
               </div>
             </div>
             <i className="fa-solid fa-robot absolute -bottom-10 -right-10 text-[160px] opacity-10"></i>
           </div>
        </div>
      </div>

      {/* PERFORMANCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100">
           <h3 className="text-xl font-black text-slate-800 mb-6">Class Performance Bands</h3>
           <div className="space-y-4">
              {bands.map((band, idx) => (
                <div key={idx} className="space-y-1.5">
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
                </div>
              ))}
           </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl flex flex-col justify-center text-center">
           <i className="fa-solid fa-award text-6xl mb-6 text-yellow-400"></i>
           <h3 className="text-2xl font-black mb-2">Class Excellence</h3>
           <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80 mb-6">Top Performer of the Session</p>
           {results.length > 0 ? (
             <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
               <div className="text-3xl font-black mb-1">{results[0].name}</div>
               <div className="text-sm font-black text-yellow-300">Rank #1 • {results[0].percentage}%</div>
             </div>
           ) : (
             <div className="text-sm font-black italic opacity-50">Waiting for result generation...</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;