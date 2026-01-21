
import { Student, CalculatedResult, SubjectType } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';

export const calculateStudentResult = (student: Student, maxMarksPerSubject: number = 100): Omit<CalculatedResult, 'rank'> => {
  const subjects = GET_SUBJECTS_FOR_CLASS(student.classLevel);
  const mainSubjects = subjects.filter(s => s.type === SubjectType.MAIN);
  
  // Use manual total if provided, otherwise calculate
  const calculatedTotal = mainSubjects.reduce((acc, sub) => {
    return acc + (student.marks[sub.key] || 0);
  }, 0);

  const total = student.manualTotal !== undefined ? student.manualTotal : calculatedTotal;

  const maxTotal = mainSubjects.length * maxMarksPerSubject;
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  return {
    ...student,
    total,
    percentage: parseFloat(percentage.toFixed(2)),
    status: percentage >= 33 ? 'Pass' : 'Fail'
  };
};

export const rankStudents = (students: Student[], classLevel: string, maxMarks: number): CalculatedResult[] => {
  const classStudents = students.filter(s => s.classLevel === classLevel);
  if (classStudents.length === 0) return [];

  const results = classStudents.map(s => calculateStudentResult(s, maxMarks));
  
  const sorted = [...results].sort((a, b) => b.total - a.total);
  
  return sorted.map((res, index) => {
    let rank = index + 1;
    if (index > 0 && res.total === sorted[index - 1].total) {
      const previousWithSameTotal = sorted.findIndex(s => s.total === res.total);
      rank = previousWithSameTotal + 1;
    }
    
    return {
      ...res,
      rank
    } as CalculatedResult;
  });
};

export const getPerformanceBands = (results: CalculatedResult[]) => {
  const bands = [
    { range: 'Above 90%', count: 0, color: '#10b981', min: 90, max: 101 },
    { range: '80-90%', count: 0, color: '#3b82f6', min: 80, max: 90 },
    { range: '60-80%', count: 0, color: '#6366f1', min: 60, max: 80 },
    { range: '40-60%', count: 0, color: '#f59e0b', min: 40, max: 60 },
    { range: 'Below 40%', count: 0, color: '#ef4444', min: 0, max: 40 },
  ];

  results.forEach(res => {
    const band = bands.find(b => res.percentage >= b.min && res.percentage < b.max);
    if (band) band.count++;
  });

  return bands;
};
