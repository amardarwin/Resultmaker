
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { CalculatedResult, SubjectType, Student, StudentMarks, ClassLevel } from '../types';
import { getPerformanceBands, calculateSubjectStats, getComparativeSubjectStats } from '../utils/calculations';
import { generateClassInsights } from '../utils/gemini';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

interface DashboardProps {
  results: CalculatedResult[];
  allStudents: Student[];
  className: string;
  onSubjectHighlight: (subject: keyof StudentMarks | null) => void;
  activeSubjectFilter: keyof StudentMarks | null;
}

const Dashboard: React.FC<DashboardProps> = ({ results, allStudents, className, onSubjectHighlight, activeSubjectFilter }) => {
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [compSubject, setCompSubject] = useState<keyof StudentMarks>('hindi');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const bands = getPerformanceBands(results);
  const totalStudents = results.length;
  const passCount = results.filter(r => r.status === 'Pass').length;
  const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  // Stats for the current class
  const subjectStats = calculateSubjectStats(results, className, 100);
  
  // Stats for the comparison section (across all classes)
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

  const activeSubjectStats = activeSubjectFilter 
    ? subjectStats.find(s => s.key === activeSubjectFilter) 
    : null;

  const poorPerformers = useMemo(() => {
    if (!activeSubjectFilter) return [];
    return results.filter(res => (res.marks[activeSubjectFilter] || 0) < 33);
  }, [activeSubjectFilter, results]);

  const filteredByBand = useMemo(() => {
    if (!selectedBand) return [];
    const band = bands.find(b => b.range === selectedBand);
    if (!band) return [];
    return results.filter(res => res.percentage >= band.min && res.percentage < band.max);
  }, [selectedBand, results, bands]);

  // List of all possible subjects for the cross-class selector
  // We take subjects from Class 10 as it contains the union of most subject types (Pbi A/B etc)
  const allPossibleSubjects = GET_SUBJECTS_FOR_CLASS('10');

  return (
    <div className="space-y-8 pb-10">
      {/* Top Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Students</span>
            <i className="fa-solid fa-users text-indigo-400"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{totalStudents}</span>
            <span className="text-xs font-bold text-slate-400">Total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Pass Rate</span>
            <i className="fa-solid fa-circle-check text-emerald-400"></i>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">{passPercentage}%</span>
            <span className="text-xs font-bold text-slate-400">{passCount} passed</span>
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

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-sparkles text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black">AI Performance Insights</h3>
                <p className="text-xs text-indigo-100 font-bold uppercase tracking-wider opacity-80">Powered by Gemini Intelligence</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateInsights}
              disabled={loadingAi || results.length === 0}
              className="px-6 py-2.5 bg-white text-indigo-700 font-black rounded-xl text-xs hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loadingAi ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              {aiInsights ? 'REFRESH ANALYSIS' : 'ANALYZE CLASS'}
            </button>
          </div>

          {aiInsights ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-in fade-in slide-in-from-top-4">
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-medium leading-relaxed text-indigo-50 text-sm">
                  {aiInsights}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-indigo-100 italic font-medium opacity-60">
              Click 'Analyze Class' to get an AI-powered strategic summary of this class's performance.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800">Performance Bands</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <YAxis allowDecimals={false} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={45} className="cursor-pointer">
                  {bands.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={selectedBand && selectedBand !== entry.range ? 0.3 : 1}
                      stroke={selectedBand === entry.range ? '#1e293b' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drill-down List for Performance Bands */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           {selectedBand ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-800">Students in {selectedBand}</h3>
                 <button onClick={() => setSelectedBand(null)} className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase">Clear</button>
               </div>
               <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                 <table className="w-full text-xs text-left">
                   <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                     <tr><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">%</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredByBand.map(res => (
                       <tr key={res.id} className="hover:bg-slate-50">
                         <td className="px-3 py-2 font-bold text-slate-500">{res.rollNo}</td>
                         <td className="px-3 py-2 font-black text-slate-800">{res.name}</td>
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
               <p className="font-black uppercase tracking-widest text-sm text-center px-4">Click a bar to view detailed student distribution</p>
             </div>
           )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800 px-2">Subject Performance Analysis</h3>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter px-2">Click cards to highlight and see students needing support</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {subjectStats.map((stat) => (
            <button 
              key={stat.key}
              onClick={() => onSubjectHighlight(activeSubjectFilter === stat.key ? null : stat.key)}
              className={`p-6 rounded-3xl border-2 transition-all text-left relative group overflow-hidden ${
                activeSubjectFilter === stat.key 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
                : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg'
              }`}
            >
              <div className="relative z-10">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-3 inline-block ${
                  activeSubjectFilter === stat.key 
                  ? 'bg-white/20 text-white' 
                  : stat.type === SubjectType.MAIN ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {stat.type}
                </span>
                <h4 className={`text-lg font-black mb-3 truncate ${activeSubjectFilter === stat.key ? 'text-white' : 'text-slate-800'}`}>
                  {stat.label}
                </h4>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${activeSubjectFilter === stat.key ? 'text-indigo-100' : 'text-slate-400'}`}>Avg Score</span>
                  <span className={`font-black ${activeSubjectFilter === stat.key ? 'text-white' : 'text-slate-800'}`}>{stat.avg}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {activeSubjectFilter && (
          <div className="bg-red-50 border-2 border-red-100 rounded-[32px] p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                Students Needing Support: {activeSubjectStats?.label}
              </h4>
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Scoring below 33%
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {poorPerformers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {poorPerformers.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-50 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Roll {s.rollNo}</div>
                        <div className="text-sm font-black text-slate-800">{s.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-red-400 uppercase leading-none mb-1">Score</div>
                        <div className="text-lg font-black text-red-600">{s.marks[activeSubjectFilter]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-emerald-600 font-black flex flex-col items-center">
                  <i className="fa-solid fa-circle-check text-4xl mb-3"></i>
                  GREAT NEWS! NO STUDENTS SCORED BELOW 33% IN THIS SUBJECT.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparative Cross-Class Section */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800">Cross-Class Comparative Analysis</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Compare subject difficulty and performance across levels 6-10</p>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2">Select Subject to Compare</label>
            <select 
              value={compSubject} 
              onChange={(e) => setCompSubject(e.target.value as keyof StudentMarks)}
              className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {allPossibleSubjects.map(sub => (
                <option key={sub.key} value={sub.key}>{sub.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-72 bg-slate-50 rounded-3xl p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativeStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="classLevel" tickFormatter={(v) => `Class ${v}`} fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="avg" name="Avg Score" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="passPerc" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-lightbulb"></i>
                 </div>
                 <div>
                    <h5 className="text-sm font-black text-indigo-900 uppercase mb-1">Comparative Trend Observation</h5>
                    <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                      {comparativeStats.filter(s => s.count > 0).length > 1 ? (
                        <>Analysis shows that <strong>{allPossibleSubjects.find(s => s.key === compSubject)?.label}</strong> averages vary between 
                        classes. Class {comparativeStats.sort((a,b) => b.avg - a.avg)[0].classLevel} is currently 
                        performing best in this specific field.</>
                      ) : (
                        "Add data for more classes to see meaningful cross-class trends."
                      )}
                    </p>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">Multi-Class Stats Table</h5>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase">
                  <tr>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3 text-right">Pass %</th>
                    <th className="px-4 py-3 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparativeStats.map(stat => (
                    <tr key={stat.classLevel} className={stat.classLevel === className ? 'bg-indigo-50/50' : ''}>
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-800">Class {stat.classLevel}</div>
                        <div className="text-[10px] font-bold text-slate-400">{stat.count} students</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-black ${stat.passPerc >= 60 ? 'text-emerald-600' : stat.passPerc >= 33 ? 'text-amber-600' : 'text-red-600'}`}>
                          {stat.count > 0 ? `${stat.passPerc}%` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-800">
                        {stat.count > 0 ? stat.avg : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
