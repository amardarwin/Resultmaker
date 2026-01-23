
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalculatedResult, Student, StudentMarks, ClassLevel, Role } from '../types';
import { getPerformanceBands, calculateSubjectStats } from '../utils/calculations';
import { generateClassInsights } from '../utils/gemini';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  results: CalculatedResult[];
  allStudents: Student[];
  className: string;
  onSubjectHighlight: (subject: keyof StudentMarks | null) => void;
  activeSubjectFilter: keyof StudentMarks | null;
  onClassChange?: (cls: ClassLevel) => void;
  onNavigateToSheet?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  results, 
  className, 
  onSubjectHighlight, 
  activeSubjectFilter, 
  onClassChange,
  onNavigateToSheet 
}) => {
  const { user } = useAuth();
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const bands = getPerformanceBands(results);
  const subjectStats = calculateSubjectStats(results, className, 100);

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

  const handlePortalNavigate = (cls: ClassLevel) => {
    if (onClassChange) onClassChange(cls);
    if (onNavigateToSheet) onNavigateToSheet();
  };

  // Logic: Identify "Teaching Assignments" that are NOT the primary class to avoid redundancy
  const distinctTeachingAssignments = user?.teachingAssignments?.filter(
    a => a.classLevel !== user.assignedClass
  ) || [];

  return (
    <div className="space-y-8 pb-10">
      {/* MANAGEMENT PORTAL: The teacher's gateway to their assigned classes */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Teacher Management Portal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* PRIMARY CLASS (Incharge View) */}
          {user?.assignedClass && (
            <button 
              onClick={() => handlePortalNavigate(user.assignedClass!)}
              className={`group relative p-6 rounded-[32px] border-2 transition-all text-left overflow-hidden ${className === user.assignedClass ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl ring-4 ring-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-300'}`}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${className === user.assignedClass ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <h4 className="text-2xl font-black">Class {user.assignedClass}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-wider opacity-70 ${className === user.assignedClass ? 'text-indigo-100' : 'text-slate-400'}`}>Primary Incharge • Full Control</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase">Open Result Sheet</span>
                   <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </button>
          )}

          {/* TEACHING ASSIGNMENTS (Subject Specialist View) */}
          {distinctTeachingAssignments.map(assignment => (
            <button 
              key={assignment.classLevel}
              onClick={() => handlePortalNavigate(assignment.classLevel)}
              className={`group relative p-6 rounded-[32px] border-2 transition-all text-left overflow-hidden ${className === assignment.classLevel ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl ring-4 ring-emerald-100' : 'bg-white border-slate-100 hover:border-emerald-300'}`}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${className === assignment.classLevel ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                    <i className="fa-solid fa-book-open"></i>
                  </div>
                  <h4 className="text-2xl font-black">Class {assignment.classLevel}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-wider opacity-70 ${className === assignment.classLevel ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Subject Specialist • {assignment.subjects.join(', ')}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase">Enter Marks</span>
                   <i className="fa-solid fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </button>
          ))}

          {/* ADMIN EXPLORER (Only for Admins) */}
          {user?.role === Role.ADMIN && (
            <div className="p-6 rounded-[32px] bg-slate-800 text-white border-2 border-slate-700">
               <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-shield-halved text-yellow-400 text-xl"></i>
                  <span className="text-xs font-black uppercase tracking-tighter">Admin Authority</span>
               </div>
               <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                 You have God-mode access across all 5 classes. Select any tab in the header to manage.
               </p>
            </div>
          )}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ANALYTICS SECTION: Focused on the selected class context */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight">Analytics: Class {className}</h3>
           <button 
              onClick={handleGenerateInsights}
              disabled={loadingAi || results.length === 0}
              className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              {loadingAi ? 'ANALYZING...' : 'GET AI REPORT'}
            </button>
        </div>

        {aiInsights && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 text-indigo-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
               <i className="fa-solid fa-sparkles text-sm"></i>
               <span className="text-[10px] font-black uppercase tracking-widest">Intelligent Observations</span>
            </div>
            <p className="text-sm font-medium leading-relaxed italic">"{aiInsights}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6">Class Performance Curve</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bands} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc', radius: 12}} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                    {bands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={selectedBand && selectedBand !== entry.range ? 0.3 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Subject Ranking</span>
               <div className="space-y-3">
                 {subjectStats.slice(0, 5).map((stat, i) => (
                   <div key={stat.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-300">#{i+1}</span>
                        <span className="text-sm font-black text-slate-800 uppercase">{stat.label}</span>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{stat.avg} Avg</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {subjectStats.map((stat) => {
            const assignment = user?.teachingAssignments?.find(a => a.classLevel === className as ClassLevel);
            const isMyResponsibility = (user?.role === Role.CLASS_INCHARGE && user.assignedClass === className) || 
                                       assignment?.subjects.includes(stat.key);
            
            return (
              <button 
                key={stat.key}
                onClick={() => onSubjectHighlight(activeSubjectFilter === stat.key ? null : stat.key)}
                className={`p-6 rounded-3xl border-2 transition-all text-left relative group overflow-hidden ${
                  activeSubjectFilter === stat.key 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105 z-10' 
                  : 'bg-white border-slate-100'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      activeSubjectFilter === stat.key ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stat.type}
                    </span>
                    {isMyResponsibility && <i className={`fa-solid fa-circle-check text-[10px] ${activeSubjectFilter === stat.key ? 'text-emerald-400' : 'text-emerald-500'}`}></i>}
                  </div>
                  <h4 className={`text-lg font-black mb-1 truncate ${activeSubjectFilter === stat.key ? 'text-white' : 'text-slate-800'}`}>
                    {stat.label}
                  </h4>
                  <div className={`text-[10px] font-black uppercase opacity-60`}>
                    Average: {stat.avg}
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
