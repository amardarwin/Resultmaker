/* eslint-disable */
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

// Internal Types
interface ResultTableProps {
  results: any[];
  classLevel: string;
  onEdit: (student: any) => void;
  onDelete: (id: string) => void;
  highlightSubject?: string | null;
  activeFilters?: { subject: string | null; band: string | null };
  onClearFilters?: () => void;
  examType: string;
  onExamTypeChange: (type: any) => void;
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
  
  // --- 1. INTERNAL RULES (No External Dependency) ---
  
  // Helper to get mark key
  const getMarkKey = (exam: string, sub: string) => `${exam.toLowerCase()}_${sub.toLowerCase()}`;

  // Helper to get Max Marks
  const getMaxMarks = (exam: string, sub: string) => {
    const type = exam.toLowerCase();
    const isPbi = sub === 'pbi_a' || sub === 'pbi_b';
    if (type === 'bimonthly') return 20;
    if (type === 'term' || type === 'preboard') return isPbi ? 65 : 80;
    if (type === 'final') return isPbi ? 75 : 100;
    return 100;
  };

  // Helper to Get Subjects List
  const getSubjects = (cls: string) => {
    // 6th-8th
    if (['6th', '7th', '8th'].includes(cls)) {
      return [
        { key: 'pbi', label: 'Punjabi' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'eng', label: 'English' },
        { key: 'math', label: 'Mathematics' },
        { key: 'sci', label: 'Science' },
        { key: 'sst', label: 'Social Studies' },
        { key: 'comp', label: 'Computer Science', isGrading: true },
        { key: 'phy_edu', label: 'Physical Edu', isGrading: true },
        { key: 'agri', label: 'Agriculture', isGrading: true },
        { key: 'drawing', label: 'Drawing', isGrading: true },
        { key: 'welcome_life', label: 'Welcome Life', isGrading: true }
      ];
    }
    // 9th-10th
    return [
      { key: 'pbi_a', label: 'Punjabi A' },
      { key: 'pbi_b', label: 'Punjabi B' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'eng', label: 'English' },
      { key: 'math', label: 'Mathematics' },
      { key: 'sci', label: 'Science' },
      { key: 'sst', label: 'Social Studies' },
      { key: 'comp', label: 'Computer Science', isGrading: true },
      { key: 'phy_edu', label: 'Physical Edu', isGrading: true },
      { key: 'drawing', label: 'Drawing', isGrading: true },
      { key: 'welcome_life', label: 'Welcome Life', isGrading: true }
    ];
  };

  const subjects = getSubjects(classLevel);
  const mainSubjects = subjects.filter(s => !s.isGrading);
  const gradingSubjects = subjects.filter(s => s.isGrading);

  // --- 2. CALCULATIONS ---
  const processedData = useMemo(() => {
    return results.map(student => {
      let totalObtained = 0;
      let totalMax = 0;

      // Calculate Main Subjects
      mainSubjects.forEach(sub => {
        const key = getMarkKey(examType, sub.key);
        const marks = parseInt(student.marks?.[key] || '0');
        const max = getMaxMarks(examType, sub.key);
        
        totalObtained += marks;
        totalMax += max;
      });

      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      
      return {
        ...student,
        totalObtained,
        percentage: percentage.toFixed(2)
      };
    });
  }, [results, examType, classLevel]);

  // --- 3. EXCEL DOWNLOAD ---
  const downloadExcel = () => {
    const headers = ['Rank', 'Roll No', 'Name', ...subjects.map(s => s.label), 'Total', '%'];
    
    const rows = processedData.map((s, idx) => {
      const rowData = [
        idx + 1,
        s.rollNo,
        s.name
      ];

      // Add Subject Marks
      subjects.forEach(sub => {
        const key = getMarkKey(examType, sub.key);
        rowData.push(s.marks?.[key] || '0');
      });

      rowData.push(s.totalObtained);
      rowData.push(s.percentage + '%');
      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Result Sheet");
    XLSX.writeFile(workbook, `ResultSheet_${classLevel}_${examType}.xlsx`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Class {classLevel} Results</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {processedData.length} Students • {examType.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-3">
           <select 
              value={examType} 
              onChange={(e) => onExamTypeChange(e.target.value)}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 outline-none"
           >
              <option value="bimonthly">Bimonthly</option>
              <option value="term">Term Exam</option>
              <option value="preboard">Preboard</option>
              <option value="final">Final Exam</option>
           </select>
           <button onClick={downloadExcel} className="px-6 py-2 bg-emerald-600 text-white font-black text-xs uppercase rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
             <i className="fa-solid fa-file-excel"></i> Download Excel
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="p-4 rounded-tl-2xl">Rank</th>
              <th className="p-4">Roll No</th>
              <th className="p-4">Name</th>
              {subjects.map(s => (
                <th key={s.key} className={`p-4 text-center ${s.isGrading ? 'text-slate-400' : 'text-white'}`}>
                  {s.label} <br/>
                  <span className="text-[8px] opacity-60">MM: {getMaxMarks(examType, s.key)}</span>
                </th>
              ))}
              <th className="p-4 text-center bg-indigo-600">Total</th>
              <th className="p-4 text-center bg-indigo-700 rounded-tr-2xl">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
            {processedData.length === 0 ? (
               <tr><td colSpan={subjects.length + 5} className="p-8 text-center text-slate-400">No data available.</td></tr>
            ) : (
              processedData.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center"><span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">{idx + 1}</span></td>
                  <td className="p-4">{s.rollNo}</td>
                  <td className="p-4 text-slate-900">{s.name}</td>
                  {subjects.map(sub => {
                    const key = getMarkKey(examType, sub.key);
                    const val = s.marks?.[key] || '0';
                    return (
                      <td key={sub.key} className="p-4 text-center">
                        {val}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">{s.totalObtained}</td>
                  <td className="p-4 text-center font-black text-white bg-indigo-500">{s.percentage}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultTable;
