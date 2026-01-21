
import React, { useState, useMemo } from 'react';
import { CalculatedResult, ClassLevel, SubjectType, StudentMarks } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

interface ResultTableProps {
  results: CalculatedResult[];
  classLevel: ClassLevel;
  onEdit: (student: CalculatedResult) => void;
  onDelete: (id: string) => void;
  highlightSubject?: keyof StudentMarks | null;
}

const ResultTable: React.FC<ResultTableProps> = ({ results, classLevel, onEdit, onDelete, highlightSubject }) => {
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
      <div className="flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search student by Name or Roll No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
          />
        </div>
        {highlightSubject && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full animate-in fade-in zoom-in-95 duration-200">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sorted By:</span>
            <span className="text-xs font-black text-indigo-700 uppercase">
              {subjects.find(s => s.key === highlightSubject)?.label || highlightSubject}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 font-bold sticky left-0 bg-slate-50 z-20 border-r border-slate-200">Roll No</th>
                <th className="px-4 py-4 font-bold sticky left-[4.55rem] bg-slate-50 z-20 border-r border-slate-200">Student Info</th>
                {subjects.map(sub => (
                  <th 
                    key={sub.key} 
                    className={`px-4 py-4 text-center font-bold border-r border-slate-100 whitespace-nowrap transition-colors ${
                      sub.key === highlightSubject ? 'bg-indigo-600 text-white z-30' : 
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
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4 font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-100">
                      {res.rollNo}
                    </td>
                    <td className="px-4 py-4 sticky left-[4.55rem] bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-200 min-w-[200px]">
                      <div className="flex flex-col space-y-2">
                        <span className="font-bold text-slate-800 truncate" title={res.name}>
                          {res.name}
                        </span>
                        <div className="flex">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                            res.status === 'Pass' 
                            ? 'bg-emerald-500 text-white border-emerald-600' 
                            : 'bg-red-500 text-white border-red-600'
                          }`}>
                            <i className={`fa-solid ${res.status === 'Pass' ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1.5`}></i>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    {subjects.map(sub => {
                      const score = res.marks[sub.key] ?? 0;
                      const isFail = sub.type === SubjectType.MAIN && score < 33;
                      const isHighligted = sub.key === highlightSubject;
                      return (
                        <td 
                          key={sub.key} 
                          className={`px-4 py-4 text-center border-r border-slate-100 transition-colors ${
                            isHighligted ? 'bg-indigo-50 font-black scale-105 shadow-inner' : 
                            sub.type === SubjectType.GRADING ? 'bg-orange-50/20 italic' : ''
                          }`}
                        >
                          <span className={`text-sm ${isFail ? 'text-red-600 font-extrabold underline decoration-red-200 underline-offset-4' : isHighligted ? 'text-indigo-800' : 'text-slate-600 font-medium'}`}>
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
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                        res.rank === 1 ? 'bg-yellow-400 text-yellow-900 shadow-md ring-2 ring-yellow-200' :
                        res.rank === 2 ? 'bg-slate-200 text-slate-800' :
                        res.rank === 3 ? 'bg-amber-100 text-amber-900' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {res.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center bg-white/50 group-hover:bg-transparent">
                      <div className="flex items-center justify-center space-x-1">
                        <button onClick={() => onEdit(res)} className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                        <button onClick={() => confirm(`Delete ${res.name}?`) && onDelete(res.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><i className="fa-solid fa-trash-can"></i></button>
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
