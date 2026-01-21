
import React, { useState, useMemo } from 'react';
import { CalculatedResult, ClassLevel, SubjectType } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

interface ResultTableProps {
  results: CalculatedResult[];
  classLevel: ClassLevel;
  onEdit: (student: CalculatedResult) => void;
  onDelete: (id: string) => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ results, classLevel, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results;
    const lowerSearch = searchTerm.toLowerCase();
    return results.filter(
      (res) =>
        res.name.toLowerCase().includes(lowerSearch) ||
        res.rollNo.toLowerCase().includes(lowerSearch)
    );
  }, [results, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
        </div>
        <input
          type="text"
          placeholder="Search by Name or Roll No..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <i className="fa-solid fa-circle-xmark"></i>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 font-bold sticky left-0 bg-slate-50 z-20 border-r border-slate-200">Roll No</th>
                <th className="px-4 py-4 font-bold sticky left-[4.55rem] bg-slate-50 z-20 border-r border-slate-200">Name & Status</th>
                {subjects.map(sub => (
                  <th 
                    key={sub.key} 
                    className={`px-4 py-4 text-center font-bold border-r border-slate-100 whitespace-nowrap ${
                      sub.type === SubjectType.GRADING ? 'bg-orange-50/80 text-orange-800' : ''
                    }`}
                  >
                    {sub.label}
                  </th>
                ))}
                <th className="px-4 py-4 text-center font-bold bg-blue-50/50 text-blue-800 border-r border-slate-100">Total</th>
                <th className="px-4 py-4 text-center font-bold bg-blue-50/50 text-blue-800 border-r border-slate-100">Perc.</th>
                <th className="px-4 py-4 text-center font-bold bg-indigo-50/50 text-indigo-800 border-r border-slate-100">Rank</th>
                <th className="px-4 py-4 text-center font-bold bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 6} className="px-4 py-12 text-center text-slate-400 italic bg-white">
                    {searchTerm ? `No matching records for "${searchTerm}"` : `No records found for Class ${classLevel}.`}
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4 font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-100">
                      {res.rollNo}
                    </td>
                    <td className="px-4 py-4 sticky left-[4.55rem] bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-200">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-slate-800 truncate max-w-[150px]" title={res.name}>
                          {res.name}
                        </span>
                        <div className="flex">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                            res.status === 'Pass' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                            : 'bg-red-50 text-red-700 border-red-200/50'
                          }`}>
                            <span className={`w-1 h-1 rounded-full mr-1 ${res.status === 'Pass' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    {subjects.map(sub => {
                      const score = res.marks[sub.key] ?? 0;
                      const isFail = sub.type === SubjectType.MAIN && score < 33;
                      return (
                        <td 
                          key={sub.key} 
                          className={`px-4 py-4 text-center border-r border-slate-100 ${
                            sub.type === SubjectType.GRADING ? 'bg-orange-50/20 italic' : ''
                          }`}
                        >
                          <span className={`text-sm ${isFail ? 'text-red-600 font-extrabold underline decoration-red-200 underline-offset-4' : 'text-slate-600 font-medium'}`}>
                            {res.marks[sub.key] ?? '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center font-black text-blue-700 bg-blue-50/20 border-r border-slate-100">
                      {res.total}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-blue-600 bg-blue-50/20 border-r border-slate-100">
                      {res.percentage}%
                    </td>
                    <td className="px-4 py-4 text-center border-r border-slate-100">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs ${
                        res.rank === 1 ? 'bg-yellow-400 text-yellow-900 shadow-sm' :
                        res.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        res.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {res.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center bg-white/50 group-hover:bg-transparent">
                      <div className="flex items-center justify-center space-x-1">
                        <button 
                          onClick={() => onEdit(res)}
                          className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                          title="Edit Student"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${res.name}'s record?`)) onDelete(res.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Delete Record"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
    
