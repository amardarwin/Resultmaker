import React, { useState, useMemo } from 'react';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { ExamType, SubjectType, ClassLevel, StudentMarks, CalculatedResult } from '../types';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';

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

  // APPLY FILTERS (Search + Dashboard Bands + Subject At-Risk)
  const filteredData = useMemo(() => {
    let data = [...results];

    // 1. Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.rollNo.toString().includes(lowerSearch)
      );
    }

    // 2. Band Filter (From Dashboard)
    if (activeFilters.band) {
      const band = activeFilters.band;
      if (band === 'Above 90%') data = data.filter(s => s.percentage >= 90);
      else if (band === '80-90%') data = data.filter(s => s.percentage >= 80 && s.percentage < 90);
      else if (band === '60-80%') data = data.filter(s => s.percentage >= 60 && s.percentage < 80);
      else if (band === '40-60%') data = data.filter(s => s.percentage >= 40 && s.percentage < 60);
      else if (band === 'Below 40%') data = data.filter(s => s.percentage < 40);
    }

    // 3. Subject At-Risk Filter (From Dashboard Insights)
    // Definition: Students scoring < 40% in the specific clicked subject
    if (activeFilters.subject) {
      const subKey = activeFilters.subject;
      const subConfig = subjects.find(s => s.key === subKey);
      const max = subConfig ? getExamMaxMarks(examType, subConfig) : 100;
      const mKey = getMarkKey(examType, subKey);
      
      data = data.filter(s => {
        const score = s.marks[mKey] || 0;
        return (score / max) * 100 < 40;
      });
    }

    return data;
  }, [results, searchTerm, activeFilters, subjects, examType]);

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) return alert("No data to export.");
    const headers = ['Rank', 'Roll No', 'Name', ...subjects.map(s => s.label), 'Total', '%', 'Status'];
    const rows = filteredData.map((res: any) => [
      res.rank, res.rollNo, `"${res.name}"`, 
      ...subjects.map(s => res.marks[getMarkKey(examType, s.key)] ?? 0),
      res.total, res.percentage, res.status
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Results_Class${classLevel}_${examType}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" placeholder="Search by name or roll..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="bg-slate-100 p-1 rounded-2xl flex w-full md:w-auto">
            {Object.values(ExamType).map(type => (
              <button
                key={type} onClick={() => onExamTypeChange(type)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  examType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(activeFilters.band || activeFilters.subject) && (
            <button onClick={onClearFilters} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100">
              Clear Filters
            </button>
          )}
          <button onClick={handleDownloadExcel} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
            <i className="fa-solid fa-file-excel"></i> Export Sheet
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER BADGE */}
      {(activeFilters.band || activeFilters.subject) && (
        <div className="bg-indigo-600 text-white px-8 py-4 rounded-[24px] flex items-center gap-4 animate-in slide-in-from-top-2">
          <i className="fa-solid fa-filter"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Filtering by: {activeFilters.band ? `Performance Band (${activeFilters.band})` : `At-Risk Students in ${String(activeFilters.subject).toUpperCase()}`}
          </span>
          <span className="ml-auto text-xs font-black">{filteredData.length} Students Found</span>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Roll</th>
                <th className="px-8 py-6 min-w-[180px]">Student Name</th>
                {subjects.map(sub => (
                  <th key={sub.key} className={`px-4 py-6 text-center whitespace-nowrap transition-all ${highlightSubject === sub.key ? 'bg-indigo-800' : ''}`}>
                    {sub.label} <br/>
                    <span className="text-[7px] opacity-50">
                      {sub.type === SubjectType.MAIN ? `Max ${getExamMaxMarks(examType, sub)}` : 'Grade'}
                    </span>
                  </th>
                ))}
                <th className="px-6 py-6 text-center bg-indigo-700">Total</th>
                <th className="px-6 py-6 text-center bg-indigo-600">%</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr><td colSpan={subjects.length + 7} className="px-8 py-32 text-center text-slate-300 font-black">No student records match the current filters.</td></tr>
              ) : (
                filteredData.map((res) => (
                  <tr key={res.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5 text-center font-black text-slate-400 group-hover:text-indigo-600">{res.rank}</td>
                    <td className="px-8 py-5 font-black text-slate-500">{res.rollNo}</td>
                    <td className="px-8 py-5 font-black text-slate-800">{res.name}</td>
                    {subjects.map(sub => {
                      const mKey = getMarkKey(examType, sub.key);
                      const score = res.marks[mKey] ?? 0;
                      const max = getExamMaxMarks(examType, sub);
                      const isLow = sub.type === SubjectType.MAIN && (score / max) * 100 < 40;
                      
                      return (
                        <td key={sub.key} className={`px-4 py-5 text-center font-bold ${isLow ? 'text-red-500' : 'text-slate-600'} ${highlightSubject === sub.key ? 'bg-indigo-50/50' : ''}`}>
                          {score}
                        </td>
                      );
                    })}
                    <td className="px-6 py-5 text-center font-black text-indigo-700 bg-indigo-50/30">{res.total}</td>
                    <td className="px-6 py-5 text-center font-black text-slate-700">{res.percentage}%</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${res.status === 'Pass' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center print:hidden">
                       <button onClick={() => onEdit && onEdit(res)} className="w-8 h-8 bg-slate-100 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                         <i className="fa-solid fa-pen-to-square"></i>
                       </button>
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
