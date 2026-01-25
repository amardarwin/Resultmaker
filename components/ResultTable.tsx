import React, { useState, useMemo } from 'react';
import { GET_SUBJECTS_FOR_CLASS, getExamMaxMarks, getMarkKey } from '../constants';
import { ExamType, SubjectType, ClassLevel, StudentMarks, CalculatedResult } from '../types';

interface ResultTableProps {
  results: CalculatedResult[];
  classLevel: ClassLevel;
  onEdit?: (student: any) => void;
  onDelete?: (id: string) => void;
  activeFilters: { subject: keyof StudentMarks | null; band: string | null };
  onClearFilters: () => void;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
  highlightSubject?: keyof StudentMarks | null;
}

const ResultTable: React.FC<ResultTableProps> = ({ 
  results = [], 
  classLevel, 
  onEdit, 
  onDelete,
  activeFilters,
  onClearFilters,
  examType,
  onExamTypeChange,
  highlightSubject
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const subjects = useMemo(() => GET_SUBJECTS_FOR_CLASS(classLevel), [classLevel]);

  const filteredData = useMemo(() => {
    let data = [...results];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.rollNo.toString().includes(lowerSearch)
      );
    }

    if (activeFilters.band) {
      const band = activeFilters.band;
      if (band === 'Above 90%') data = data.filter(s => s.percentage >= 90);
      else if (band === '80-90%') data = data.filter(s => s.percentage >= 80 && s.percentage < 90);
      else if (band === '60-80%') data = data.filter(s => s.percentage >= 60 && s.percentage < 80);
      else if (band === '40-60%') data = data.filter(s => s.percentage >= 40 && s.percentage < 60);
      else if (band === 'Below 40%') data = data.filter(s => s.percentage < 40);
    }

    if (activeFilters.subject) {
      const subKey = activeFilters.subject;
      const subConfig = subjects.find(s => s.key === subKey);
      const max = subConfig ? getExamMaxMarks(examType, subConfig) : 100;
      const mKey = getMarkKey(examType, subKey);
      data = data.filter(s => ((s.marks[mKey] || 0) / max) * 100 < 40);
    }

    return data;
  }, [results, searchTerm, activeFilters, subjects, examType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(activeFilters.band || activeFilters.subject) && (
            <button onClick={onClearFilters} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Roll</th>
                <th className="px-8 py-6 min-w-[180px]">Name</th>
                {subjects.map(sub => (
                  <th key={sub.key} className="px-4 py-6 text-center whitespace-nowrap">
                    {sub.label} <br/>
                    <span className="text-[7px] opacity-50">Max {getExamMaxMarks(examType, sub)}</span>
                  </th>
                ))}
                <th className="px-6 py-6 text-center bg-indigo-700">Total</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((res) => (
                <tr key={res.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-5 text-center font-black">{res.rank}</td>
                  <td className="px-8 py-5 font-black text-slate-500">{res.rollNo}</td>
                  <td className="px-8 py-5 font-black text-slate-800">{res.name}</td>
                  {subjects.map(sub => {
                    const mKey = getMarkKey(examType, sub.key);
                    return <td key={sub.key} className="px-4 py-5 text-center font-bold">{res.marks[mKey] ?? 0}</td>;
                  })}
                  <td className="px-6 py-5 text-center font-black text-indigo-700">{res.total}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${res.status === 'Pass' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => onEdit && onEdit(res)} className="w-8 h-8 bg-slate-100 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
