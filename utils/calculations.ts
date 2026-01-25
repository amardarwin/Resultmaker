import { Student, CalculatedResult, SubjectType, StudentMarks, ClassLevel, ExamType } from '../types';
import { GET_SUBJECTS_FOR_CLASS, ALL_CLASSES, getExamMaxMarks, getMarkKey } from '../constants';

export const calculateStudentResult = (
  student: Student, 
  examType: ExamType
): Omit<CalculatedResult, 'rank'> => {
  const subjects = GET_SUBJECTS_FOR_CLASS(student.classLevel);
  const mainSubjects = subjects.filter(s => s.type === SubjectType.MAIN);
  
  const calculatedTotal = mainSubjects.reduce((acc, sub) => {
    const key = getMarkKey(examType, sub.key);
    return acc + (student.marks[key] || 0);
  }, 0);

  const total = student.manualTotal !== undefined ? student.manualTotal : calculatedTotal;

  const maxTotal = mainSubjects.reduce((acc, sub) => {
    return acc + getExamMaxMarks(examType, sub);
  }, 0);

  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  return {
    ...student,
    total,
    percentage: parseFloat(percentage.toFixed(2)),
    status: percentage >= 33 ? 'Pass' : 'Fail'
  };
};

export const rankStudents = (
  students: Student[], 
  classLevel: string, 
  examType: ExamType,
  sortBySubject?: string
): CalculatedResult[] => {
  const classStudents = students.filter(s => s.classLevel === classLevel);
  if (classStudents.length === 0) return [];

  const results = classStudents.map(s => calculateStudentResult(s, examType));
  
  const sorted = [...results].sort((a, b) => {
    if (sortBySubject && sortBySubject !== 'total' && sortBySubject !== 'percentage') {
      const key = getMarkKey(examType, sortBySubject);
      const valA = a.marks[key] ?? 0;
      const valB = b.marks[key] ?? 0;
      return valB - valA;
    }
    return b.total - a.total;
  });
  
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

export const calculateSubjectStats = (results: CalculatedResult[], classLevel: string, examType: ExamType) => {
  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel as any);
  
  return subjects.map(sub => {
    const maxVal = getExamMaxMarks(examType, sub);
    const mKey = getMarkKey(examType, sub.key);
    const scores = results.map(r => r.marks[mKey] ?? 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const passCount = scores.filter(s => (s / maxVal) * 100 >= 33).length;
    const passPerc = scores.length > 0 ? (passCount / scores.length) * 100 : 0;

    return {
      key: sub.key,
      label: sub.label,
      type: sub.type,
      avg: parseFloat(avg.toFixed(1)),
      highest,
      passPerc: parseFloat(passPerc.toFixed(1)),
      scores 
    };
  });
};

export const getComparativeSubjectStats = (allStudents: Student[], subjectKey: keyof StudentMarks | string, examType: ExamType) => {
  return ALL_CLASSES.map(cls => {
    const classResults = allStudents
      .filter(s => s.classLevel === cls)
      .map(s => calculateStudentResult(s, examType));
    
    const mKey = getMarkKey(examType, subjectKey);
    const scores = classResults.map(r => r.marks[mKey] ?? 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const passCount = scores.filter(s => {
      const subConfig = GET_SUBJECTS_FOR_CLASS(cls).find(sc => String(sc.key) === String(subjectKey));
      const max = subConfig ? getExamMaxMarks(examType, subConfig) : 100;
      return (s / max) * 100 >= 33;
    }).length;
    const passPerc = scores.length > 0 ? (passCount / scores.length) * 100 : 0;

    return {
      classLevel: cls,
      avg: parseFloat(avg.toFixed(1)),
      highest,
      passPerc: parseFloat(passPerc.toFixed(1)),
      count: scores.length
    };
  });
};
