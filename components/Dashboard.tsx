
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { CalculatedResult, SubjectType, Student, StudentMarks } from '../types';
import { getPerformanceBands, calculateSubjectStats, getComparativeSubjectStats } from '../utils/calculations';

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
  
  const bands = getPerformanceBands(results);
  const totalStudents = results.length;
  const passCount = results.filter(r => r.status === 'Pass').length;
  const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  const subjectStats = calculateSubjectStats(results, className, 100);
  const comparativeStats = getComparativeSubjectStats(allStudents, compSubject);

  const pieData = [
    { name: 'Passed', value: passCount, color: '#10b981' },
    { name: 'Failed', value: totalStudents - passCount, color: '#ef4444' }
  ];

  const filteredByBand = useMemo(() => {
    if (!selectedBand) return [];
    const band = bands.find(b => b.range === selectedBand);
    if (!band) return [];
    return results.filter(res => res.percentage >= band.min && res.percentage < band.max);
  }, [selectedBand, results, bands]);

  const handleBarClick = (data: any) => {
    if (data && data.range) {
      setSelectedBand(selectedBand === data.range ? null : data.range);
    }
  };

  const activeSubjectStats = activeSubjectFilter 
    ? subjectStats.find(s => s.key === activeSubjectFilter) 
    : null;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800">Performance Distribution</h3>
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

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           {selectedBand ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-800">Students in {selectedBand}</h3>
                 <button onClick={() => setSelectedBand(null)} className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase">Clear</button>
               </div>
               <div className="max-h-64 overflow-y-auto pr-2">
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

        {activeSubjectStats && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-[32px] p-8 animate-in zoom-in-95 duration-300">
            <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg">{activeSubjectStats.label[0]}</span>
              {activeSubjectStats.label} Class Summary
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm overflow-x-auto">
                <h5 className="text-sm font-black text-slate-400 uppercase mb-4">Class-wise Comparison for {activeSubjectStats.label}</h5>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                    <tr><th className="px-4 py-2">Class</th><th className="px-4 py-2">Avg Marks</th><th className="px-4 py-2">Pass %</th><th className="px-4 py-2">Highest</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {comparativeStats.map(stat => (
                      <tr key={stat.classLevel} className={stat.classLevel === className ? 'bg-indigo-50/50' : ''}>
                        <td className="px-4 py-3">Class {stat.classLevel}</td>
                        <td className="px-4 py-3">{stat.avg}</td>
                        <td className="px-4 py-3 text-emerald-600">{stat.passPerc}%</td>
                        <td className="px-4 py-3 text-indigo-600">{stat.highest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h5 className="text-sm font-black text-slate-400 uppercase mb-4">Stats Explanation</h5>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  Comparing <strong>{activeSubjectStats.label}</strong> performance across all classes identifies systemic strengths or areas needing attention. High pass percentages in lower classes with drops in higher classes may indicate increasing syllabus difficulty.
                </p>
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-black text-amber-600 uppercase mb-1">Observation</div>
                  <div className="text-xs font-bold text-amber-800">
                    {className === comparativeStats.sort((a,b) => b.avg - a.avg)[0].classLevel ? `Your class (${className}) is currently leading in ${activeSubjectStats.label}!` : `Class ${comparativeStats.sort((a,b) => b.avg - a.avg)[0].classLevel} has the highest average.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
