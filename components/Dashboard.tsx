import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalculatedResult, SubjectType, Student, StudentMarks, ClassLevel, Role } from '../types';
import { getPerformanceBands, calculateSubjectStats, getComparativeSubjectStats } from '../utils/calculations';
import { generateClassInsights } from '../utils/gemini';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  results: CalculatedResult[];
  allStudents: Student[];
  className: string;
  onSubjectHighlight: (subject: keyof StudentMarks | null) => void;
  activeSubjectFilter: keyof StudentMarks | null;
  onClassChange?: (cls: ClassLevel) => void; // Prop to support switching context
}

const Dashboard: React.FC<DashboardProps> = ({ results, allStudents, className, onSubjectHighlight, activeSubjectFilter, onClassChange }) => {
  const { user } = useAuth();
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  
  // Logic: Defaults to first subject assigned for this specific class
  const [compSubject, setCompSubject] = useState<keyof StudentMarks>(() => {
    const classLevel = className as ClassLevel;
    const assignment = user?.teachingAssignments?.find(a => a.classLevel === classLevel);
    if (assignment && assignment.subjects.length > 0) {
      return assignment.subjects[0];
    }
    return 'hindi';
  });

  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const bands = getPerformanceBands(results);
  const totalStudents = results.length;
  const passCount = results.filter(r => r.status === 'Pass').length;
  const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  const subjectStats = calculateSubjectStats(results, className, 100);
  const comparativeStats = getComparativeSubjectStats(allStudents, compSubject);

  const handleBarClick = (data: any) => {
    if (data && data.range) {
      setSelectedBand(selectedBand === data.range ? null : data.range);
    }
  };

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const insights = await generateClassInsights(results, className as ClassLevel);
    setAiInsights(insights || "Unable to generate insights.");
    setLoadingAi(false);
  };

  const filteredByBand = useMemo(() => {
    if (!selectedBand) return [];
    const band = bands.find(b => b.range === selectedBand);
    if (!band) return [];
    return results.filter(res => res.percentage >= band.min && res.percentage < band.max);
  }, [selectedBand, results, bands]);

  const allPossibleSubjects = GET_SUBJECTS_FOR_CLASS(className as ClassLevel);
  const isSubjectLocked = user?.role === Role.SUBJECT_TEACHER;

  // Hybrid Role Logic: Check if current user is an incharge with teaching assignments
  const isHybridIncharge = user?.role === Role.CLASS_INCHARGE && (user.teachingAssignments?.length || 0) > 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Unified Header with Switch View for Hybrid Roles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Analytics Overview</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1">Class {className} Performance Dashboard</p>
        </div>

        {isHybridIncharge && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Switch View:</span>
            <div className="flex gap-1">
              <button 
                onClick={() => onClassChange?.(user.assignedClass!)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${className === user.assignedClass ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                My Class (Incharge)
              </button>
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              {user.teachingAssignments?.map(a => (
                <button 
                  key={a.classLevel}
                  onClick={() => onClassChange?.(a.classLevel)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${className === a.classLevel ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  C-{a.classLevel} (Teacher)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Students</span>
            <i className="fa-solid fa-users text-indigo-400"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{totalStudents}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Pass Rate</span>
            <i className="fa-solid fa-circle-check text-emerald-400"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">{passPercentage}%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Class Avg</span>
            <i className="fa-solid fa-chart-line text-blue-400"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-600">
              {totalStudents > 0 ? (results.reduce((a, b) => a + b.total, 0) / totalStudents).toFixed(0) : 0}
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Highest</span>
            <i className="fa-solid fa-trophy text-yellow-500"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">
              {totalStudents > 0 ? Math.max(...results.map(r => r.total)) : 0}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-sparkles text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black">AI Insights</h3>
                <p className="text-xs text-indigo-100 font-bold uppercase opacity-80">Class Analytics Mode</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateInsights}
              disabled={loadingAi || results.length === 0}
              className="px-6 py-2.5 bg-white text-indigo-700 font-black rounded-xl text-xs shadow-lg disabled:opacity-50"
            >
              {loadingAi ? 'ANALYZING...' : 'ANALYZE CLASS'}
            </button>
          </div>
          {aiInsights && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-sm leading-relaxed">{aiInsights}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6">Performance Bands</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc', radius: 8}} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={45}>
                  {bands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={selectedBand && selectedBand !== entry.range ? 0.3 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           {selectedBand ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-800">{selectedBand} Details</h3>
                 <button onClick={() => setSelectedBand(null)} className="text-xs font-black text-indigo-600">CLEAR</button>
               </div>
               <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                 <table className="w-full text-xs text-left">
                   <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                     <tr><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">%</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredByBand.map(res => (
                       <tr key={res.id} className="hover:bg-slate-50">
                         <td className="px-3 py-2 font-bold">{res.rollNo}</td>
                         <td className="px-3 py-2 font-black">{res.name}</td>
                         <td className="px-3 py-2 text-right font-black text-indigo-600">{res.percentage}%</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
               <i className="fa-solid fa-chart-simple text-6xl mb-4 opacity-20"></i>
               <p className="font-black uppercase tracking-widest text-sm text-center">Click a band to view students</p>
             </div>
           )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800 px-2">Subject Performance Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {subjectStats.map((stat) => {
            const classLevel = className as ClassLevel;
            const assignment = user?.teachingAssignments?.find(a => a.classLevel === classLevel);
            const isAssignedSubject = (user?.role === Role.SUBJECT_TEACHER || user?.role === Role.CLASS_INCHARGE) && assignment?.subjects.includes(stat.key);
            
            return (
              <button 
                key={stat.key}
                onClick={() => onSubjectHighlight(activeSubjectFilter === stat.key ? null : stat.key)}
                className={`p-6 rounded-3xl border-2 transition-all text-left relative group overflow-hidden ${
                  activeSubjectFilter === stat.key 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-slate-100'
                } ${isAssignedSubject ? 'ring-2 ring-emerald-400' : ''}`}
              >
                <div className="relative z-10">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-3 inline-block ${
                    activeSubjectFilter === stat.key ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {stat.type} {isAssignedSubject && '• ASSIGNED'}
                  </span>
                  <h4 className={`text-lg font-black mb-3 truncate ${activeSubjectFilter === stat.key ? 'text-white' : 'text-slate-800'}`}>
                    {stat.label}
                  </h4>
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="opacity-60">Avg Score</span>
                    <span>{stat.avg}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;