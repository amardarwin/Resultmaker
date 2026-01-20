
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { CalculatedResult } from '../types';
import { getPerformanceBands } from '../utils/calculations';

interface DashboardProps {
  results: CalculatedResult[];
  className: string;
}

const Dashboard: React.FC<DashboardProps> = ({ results, className }) => {
  const bands = getPerformanceBands(results);
  const totalStudents = results.length;
  const passCount = results.filter(r => r.status === 'Pass').length;
  const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Passed', value: passCount, color: '#10b981' },
    { name: 'Failed', value: totalStudents - passCount, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm font-medium">Total Students</span>
          <span className="text-4xl font-bold text-slate-800">{totalStudents}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm font-medium">Pass Percentage</span>
          <span className="text-4xl font-bold text-emerald-600">{passPercentage}%</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm font-medium">Class Avg Total</span>
          <span className="text-4xl font-bold text-blue-600">
            {totalStudents > 0 ? (results.reduce((a, b) => a + b.total, 0) / totalStudents).toFixed(0) : 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Result Summary</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full h-full max-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {bands.map((band, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: band.color }}></div>
                  <span className="text-sm text-slate-600 w-24 font-medium">{band.range}</span>
                  <span className="text-sm font-bold text-slate-800">{band.count} Students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
