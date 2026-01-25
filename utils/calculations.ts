/* eslint-disable */
import { Student, ClassLevel, ExamType } from '../types';

// INTERNAL HELPERS (No imports from examRules)
const getMarkKey = (exam: string, sub: string) => `${exam.toLowerCase()}_${sub.toLowerCase()}`;

const getSubjects = (cls: string) => {
    // 6th-8th
    if (['6th', '7th', '8th'].includes(cls)) {
      return ['math', 'sci', 'eng', 'sst', 'hindi', 'pbi']; // Main Subjects Only
    }
    // 9th-10th
    return ['math', 'sci', 'eng', 'sst', 'hindi', 'pbi_a', 'pbi_b']; // Main Subjects Only
};

const getMaxMarks = (exam: string, sub: string) => {
    const type = exam.toLowerCase();
    const isPbi = sub === 'pbi_a' || sub === 'pbi_b';
    if (type === 'bimonthly') return 20;
    if (type === 'term' || type === 'preboard') return isPbi ? 65 : 80;
    if (type === 'final') return isPbi ? 75 : 100;
    return 100;
};

export const rankStudents = (
  students: Student[],
  classLevel: ClassLevel,
  examType: ExamType,
  sortBySubject?: string
): any[] => {
  if (!students || students.length === 0) return [];

  const subjects = getSubjects(classLevel);

  const processed = students.map(student => {
    let totalObtained = 0;
    let totalMax = 0;

    subjects.forEach(sub => {
      const key = getMarkKey(examType, sub);
      const val = parseInt(student.marks?.[key] || '0');
      const max = getMaxMarks(examType, sub);
      
      totalObtained += isNaN(val) ? 0 : val;
      totalMax += max;
    });

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    return {
      ...student,
      totalObtained,
      percentage: parseFloat(percentage.toFixed(2))
    };
  });

  // Sort by Total or Specific Subject
  return processed.sort((a, b) => {
    if (sortBySubject) {
        const key = getMarkKey(examType, sortBySubject);
        const valA = parseInt(a.marks?.[key] || '0');
        const valB = parseInt(b.marks?.[key] || '0');
        return valB - valA;
    }
    return b.totalObtained - a.totalObtained;
  });
};
