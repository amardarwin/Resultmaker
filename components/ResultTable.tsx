import React, { useState, useMemo } from 'react';
import { CalculatedResult, ClassLevel, SubjectType, StudentMarks, Role, ExamType } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { generateStudentRemarks } from '../utils/gemini';
import { useAuth } from '../contexts/AuthContext';
import { getColumnPermission, canPerformAdminAction } from '../utils/permissions';
import { exportToCSV } from '../utils/export';
import { getPerformanceBands } from '../utils/calculations';
import { getExamMaxMarks, getMarkKey } from '../utils/examRules';

interface ResultTableProps {
  results: CalculatedResult[];
  classLevel: ClassLevel;
  onEdit: (student: CalculatedResult) => void;
  onDelete: (id: string) => void;
  highlightSubject?: keyof StudentMarks | null;
  activeFilters: { subject: keyof StudentMarks | null, band: string | null };
  onClearFilters: () => void;
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ 
  results, 
  classLevel, 
  onEdit, 
  onDelete, 
  highlightSubject,
  activeFilters,
  onClearFilters,
  examType,
  onExamTypeChange
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loadingRemarks, setLoadingRemarks] = useState<Record<string, boolean>>({});
  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);

  // Apply filters from Dashboard + Search
  const processedResults = useMemo(() => {
    let list = results;

    // Apply dashboard subject at-risk filter (< 40%)
    if (activeFilters.subject) {
      const subConfig = subjects.find(s => s.key === activeFilters.subject)!;
      const maxMarks = getExamMaxMarks(examType, subConfig);
      // activeFilters.subject is keyof StudentMarks, getMarkKey now supports it
      const mKey = getMarkKey(examType, activeFilters.subject);
      list = list.filter(r => ((r.marks[mKey] || 0) / maxMarks) * 100 < 40);
    }

    // Apply dashboard performance band filter
    if (activeFilters.band) {
      const bands = getPerformanceBands(results);
      const band = bands.find(b => b.range === activeFilters.band);
      if (band) {
        list = list.filter(r => r.percentage >= band.min && r.percentage < band.max);
      }
    }

    // Apply text search
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(
        (res) =>
          res.name.toLowerCase().includes(lowerSearch) ||
          res.rollNo.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [results, activeFilters, searchTerm, examType, subjects]);

  const handleGenerateRemark = async (student: CalculatedResult) => {
    setLoadingRemarks(prev => ({ ...prev, [student.id]: true }));
    const remark = await generateStudentRemarks(student);
    setRemarks(prev => ({ ...prev, [student.id]: remark || "Excellent effort!" }));
    setLoadingRemarks(prev => ({ ...prev, [student.id]: false }));
  };

  const handleExport = () => {
    exportToCSV(processedResults, classLevel);
  };

  const isAdminAuthorized = canPerformAdminAction(user, classLevel);
  const hasActiveFilters = activeFilters.subject || activeFilters.band;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-2 border-slate-100 rounded-2xl bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-bold transition-all shadow-sm"
            />
          </div>

          <div className="bg-white p-1 rounded-2xl border-2 border-slate-100 flex shadow-sm">
            {Object.values(ExamType).map(type => (
              <button 
                key={type}
                onClick={() => onExamTypeChange(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  examType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <div className="flex items-center gap-3 bg-white border-2 border-indigo-100 px-4 py-2 rounded-2xl shadow-sm animate-in fade-in slide-in-from-right-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Filter</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase">
                  {/* Fix: Safely convert subject to string before using toUpperCase() */}
                  {activeFilters.subject && `At-risk in ${String(activeFilters.subject).toUpperCase()}`}
                  {activeFilters.subject && activeFilters.band && ' + '}
                  {activeFilters.band && `Band: ${activeFilters.band}`}
                </span>
              </div>
              <button 
                onClick={onClearFilters}
                className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                title="Clear Filters"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
          
          {(user?.role === Role.ADMIN || user?.role === Role.CLASS_INCHARGE) && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <i className="fa-solid fa-file-csv text-emerald-500"></i>
              Export Current
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] text-slate-400 font-black uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 sticky left-0 bg-slate-50 z-20 border-r border-slate-100">Roll No</th>
                <th className="px-6 py-5 sticky left-[84px] bg-slate-50 z-20 border-r border-slate-200">Student Info</th>
                
                {subjects.map(sub => {
                  const perm = getColumnPermission(user, classLevel, sub.key);
                  const isLocked = perm === 'READ';
                  const isFocused = sub.key === highlightSubject;
                  return (
                    <th 
                      key={sub.key} 
                      className={`px-4 py-5 text-center whitespace-nowrap border-r border-slate-100 transition-all ${
                        isFocused ? 'bg-indigo-600 text-white z-30' : 
                        sub.type === SubjectType.GRADING ? 'bg-orange-50/50 text-orange-800 italic' : ''
                      } ${isLocked ? 'opacity-40' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="mb-1">{sub.label}</span>
                        <span className="text-[8px] opacity-60 font-black">Max: {getExamMaxMarks(examType, sub)}</span>
                        {isLocked && <i className="fa-solid fa-lock text-[8px] mt-1"></i>}
                      </div>
                    </th>
                  );
                })}
                
                <th className="px-6 py-5 text-center font-black text-blue-800 bg-blue-50/50 border-r border-slate-100">Total</th>
                <th className="px-6 py-5 text-center font-black text-emerald-800 bg-emerald-50/50 border-r border-slate-100">%</th>
                <th className="px-6 py-5 text-center font-black text-slate-800 bg-slate-50/50 border-r border-slate-100">Rank</th>
                {user?.role !== Role.STUDENT && <th className="px-6 py-5 text-center">Control</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {processedResults.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 6} className="px-6 py-20 text-center text-slate-400 italic bg-white">
                    <div className="flex flex-col items-center">
                       <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-20"></i>
                       <p className="font-black text-sm uppercase tracking-widest">No matching student records</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedResults.map((res) => (
                  <React.Fragment key={res.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-black text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100">
                        {res.rollNo}
                      </td>
                      <td className="px-6 py-5 sticky left-[84px] bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-200 min-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 truncate" title={res.name}>
                            {res.name}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                              res.status === 'Pass' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {res.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {subjects.map(sub => {
                        // sub.key is keyof StudentMarks, getMarkKey now supports it
                        const mKey = getMarkKey(examType, sub.key);
                        const score = res.marks[mKey] ?? 0;
                        const maxMarks = getExamMaxMarks(examType, sub);
                        const isAtRisk = ((score / maxMarks) * 100) < 40;
                        const isFail = sub.type === SubjectType.MAIN && score < (maxMarks * 0.33);
                        const perm = getColumnPermission(user, classLevel, sub.key);
                        const isLocked = perm === 'READ';
                        const isHighlighted = sub.key === highlightSubject;
                        
                        return (
                          <td 
                            key={sub.key} 
                            className={`px-4 py-5 text-center border-r border-slate-100 transition-colors ${
                              isHighlighted ? 'bg-slate-900 text-white font-black' : 
                              isLocked ? 'bg-slate-50 opacity-40' : ''
                            }`}
                          >
                            <span className={`text-sm font-bold ${isAtRisk && isHighlighted ? 'text-red-300' : isFail ? 'text-red-600' : isHighlighted ? 'text-white' : 'text-slate-600'}`}>
                              {res.marks[mKey] ?? '-'}
                            </span>
                          </td>
                        );
                      })}
                      
                      <td className="px-6 py-5 text-center font-black text-blue-700 bg-blue-50/10 border-r border-slate-100">
                        {res.total}
                      </td>
                      <td className="px-6 py-5 text-center font-black text-emerald-700 bg-emerald-50/10 border-r border-slate-100">
                        {res.percentage}%
                      </td>
                      <td className="px-6 py-5 text-center border-r border-slate-100">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                          res.rank === 1 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' :
                          res.rank === 2 ? 'bg-slate-200 text-slate-600' :
                          res.rank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {res.rank}
                        </span>
                      </td>
                      
                      {user?.role !== Role.STUDENT && (
                        <td className="px-6 py-5 text-center">
                          {isAdminAuthorized ? (
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => onEdit(res)} className="w-8 h-8 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"><i className="fa-solid fa-pen"></i></button>
                              <button onClick={() => confirm(`Permanently delete ${res.name}?`) && onDelete(res.id)} className="w-8 h-8 flex items-center justify-center text-red-300 hover:bg-red-600 hover:text-white rounded-xl transition-all"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          ) : (
                            <i className="fa-solid fa-lock text-slate-200"></i>
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
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
