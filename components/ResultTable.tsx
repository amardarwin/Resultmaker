import React, { useState, useMemo } from 'react';

/**
 * ResultTable - STANDALONE VERSION
 * Features: Dynamic Exam selection, Prefix-based data fetching, 
 * and localized max-marks logic.
 */
const ResultTable: React.FC<any> = ({ 
  results = [], 
  classLevel = '6', 
  onEdit, 
  onDelete 
}) => {
  // 1. Local State for Exam Type
  const [examType, setExamType] = useState<string>('Final Exam');
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Localized Subject Configuration (Matches Entry Form logic)
  const subjects = useMemo(() => {
    const isMiddle = ['6', '7', '8'].includes(classLevel);
    if (isMiddle) {
      return [
        { key: 'pbi', label: 'Punjabi' },
        { key: 'hindi', label: 'Hindi' },
        { key: 'eng', label: 'English' },
        { key: 'math', label: 'Math' },
        { key: 'sci', label: 'Science' },
        { key: 'sst', label: 'SST' },
      ];
    }
    return [
      { key: 'pbi_a', label: 'Pbi A' },
      { key: 'pbi_b', label: 'Pbi B' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'eng', label: 'English' },
      { key: 'math', label: 'Math' },
      { key: 'sci', label: 'Science' },
      { key: 'sst', label: 'SST' },
    ];
  }, [classLevel]);

  // 3. Calculation Helpers
  const getMaxMarks = (exam: string, subKey: string) => {
    if (exam === 'Bimonthly') return 20;
    if (exam === 'Term Exam' || exam === 'Preboard') return 80;
    if (exam === 'Final Exam') {
      const lower = subKey.toLowerCase();
      if (lower.includes('pbi_a') || lower.includes('pbi_b') || lower.includes('punjabi a') || lower.includes('punjabi b')) {
        return 75;
      }
      return 100;
    }
    return 100;
  };

  const getStorageKey = (exam: string, subKey: string) => {
    const prefix = exam.toLowerCase().split(' ')[0]; // 'final', 'term', etc.
    return `${prefix}_${subKey.toLowerCase()}`;
  };

  // 4. Process and Calculate Results
  const processedData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    return results
      .filter((s: any) => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.rollNo.toString().includes(lowerSearch)
      )
      .map((student: any) => {
        let obtained = 0;
        let totalMax = 0;
        
        const marksMapping: Record<string, number> = {};
        
        subjects.forEach(sub => {
          const key = getStorageKey(examType, sub.key);
          const score = student.marks?.[key] || 0;
          marksMapping[sub.key] = score;
          
          obtained += score;
          totalMax += getMaxMarks(examType, sub.key);
        });

        const percentage = totalMax > 0 ? (obtained / totalMax) * 100 : 0;

        return {
          ...student,
          displayedMarks: marksMapping,
          calculatedObtained: obtained,
          calculatedMax: totalMax,
          calculatedPercentage: percentage.toFixed(2),
          isPass: percentage >= 33
        };
      })
      .sort((a, b) => b.calculatedObtained - a.calculatedObtained); // Automatic Ranking Sort
  }, [results, examType, subjects, searchTerm]);

  // 5. Export to Excel (CSV) logic
  const handleDownloadExcel = () => {
    if (processedData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Define CSV Headers
    const headers = [
      'Rank',
      'Roll No',
      'Student Name',
      ...subjects.map(s => s.label),
      'Total Obtained',
      'Max Marks',
      'Percentage (%)',
      'Status'
    ];

    // Map rows with ranks
    const rows = processedData.map((res: any, idx: number) => [
      idx + 1,
      res.rollNo,
      `"${res.name.replace(/"/g, '""')}"`,
      ...subjects.map(s => res.displayedMarks[s.key] ?? 0),
      res.calculatedObtained,
      res.calculatedMax,
      res.calculatedPercentage,
      res.isPass ? 'Pass' : 'Fail'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const examSlug = examType.replace(/\s+/g, '_');
    link.setAttribute('download', `ResultSheet_${classLevel}_${examSlug}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search Student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="bg-slate-100 p-1 rounded-2xl flex w-full md:w-auto">
            {['Bimonthly', 'Term Exam', 'Preboard', 'Final Exam'].map(type => (
              <button
                key={type}
                onClick={() => setExamType(type)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  examType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={handleDownloadExcel}
            className="flex-1 lg:flex-none px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-file-excel"></i>
            Download Excel
          </button>
        </div>
      </div>

      {/* RESULT SHEET */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr className="text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-6 sticky left-0 bg-slate-900 z-10">Rank</th>
                <th className="px-8 py-6 sticky left-[80px] bg-slate-900 z-10">Roll No</th>
                <th className="px-8 py-6 min-w-[200px]">Student Identity</th>
                {subjects.map(sub => (
                  <th key={sub.key} className="px-4 py-6 text-center whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{sub.label}</span>
                      <span className="text-[7px] opacity-50 font-black">Max {getMaxMarks(examType, sub.key)}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-6 text-center bg-indigo-800">Total</th>
                <th className="px-6 py-6 text-center bg-indigo-700">%age</th>
                <th className="px-6 py-6 text-center bg-slate-800">Status</th>
                <th className="px-6 py-6 text-center print:hidden">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 7} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                    No results found for {examType}
                  </td>
                </tr>
              ) : (
                processedData.map((res: any, idx: number) => (
                  <tr key={res.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-yellow-400 text-white' : 
                        idx === 1 ? 'bg-slate-300 text-white' : 
                        idx === 2 ? 'bg-amber-100 text-amber-700' : 
                        'text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-500 sticky left-[80px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-50">
                      {res.rollNo}
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800">
                      {res.name}
                    </td>
                    {subjects.map(sub => (
                      <td key={sub.key} className="px-4 py-5 text-center font-bold text-slate-600">
                        {res.displayedMarks[sub.key] ?? '-'}
                      </td>
                    ))}
                    <td className="px-6 py-5 text-center font-black text-indigo-700 bg-indigo-50/30">
                      {res.calculatedObtained}
                    </td>
                    <td className="px-6 py-5 text-center font-black text-slate-900">
                      {res.calculatedPercentage}%
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        res.isPass ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {res.isPass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center print:hidden">
                       <button onClick={() => onEdit && onEdit(res)} className="w-8 h-8 bg-slate-100 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                         <i className="fa-solid fa-pen"></i>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ANALYTICS FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-graduation-cap"></i></div>
           <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block">Pass Percentage</span>
              <span className="text-xl font-black text-slate-800">
                {processedData.length > 0 ? ((processedData.filter((r: any) => r.isPass).length / processedData.length) * 100).toFixed(0) : 0}%
              </span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-medal"></i></div>
           <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block">Top Achiever</span>
              <span className="text-xl font-black text-slate-800 truncate max-w-[150px] block">
                {processedData[0]?.name || 'N/A'}
              </span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-users"></i></div>
           <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block">Total Strength</span>
              <span className="text-xl font-black text-slate-800">{processedData.length} Students</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
