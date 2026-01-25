import { ClassLevel, SubjectConfig, SubjectType, ExamType } from './types';

export const MIDDLE_SCHOOL_CLASSES: ClassLevel[] = ['6', '7', '8'];
export const HIGH_SCHOOL_CLASSES: ClassLevel[] = ['9', '10'];

export const MIDDLE_SUBJECTS: SubjectConfig[] = [
  { key: 'pbi', label: 'Pbi', type: SubjectType.MAIN },
  { key: 'hindi', label: 'Hindi', type: SubjectType.MAIN },
  { key: 'eng', label: 'Eng', type: SubjectType.MAIN },
  { key: 'math', label: 'Math', type: SubjectType.MAIN },
  { key: 'sci', label: 'Sci', type: SubjectType.MAIN },
  { key: 'sst', label: 'SST', type: SubjectType.MAIN },
  { key: 'comp', label: 'Comp', type: SubjectType.GRADING },
  { key: 'phy_edu', label: 'Phy Edu', type: SubjectType.GRADING },
  { key: 'agri', label: 'Agri', type: SubjectType.GRADING },
];

export const HIGH_SUBJECTS: SubjectConfig[] = [
  { key: 'pbi_a', label: 'Pbi A', type: SubjectType.MAIN },
  { key: 'pbi_b', label: 'Pbi B', type: SubjectType.MAIN },
  { key: 'hindi', label: 'Hindi', type: SubjectType.MAIN },
  { key: 'eng', label: 'Eng', type: SubjectType.MAIN },
  { key: 'math', label: 'Math', type: SubjectType.MAIN },
  { key: 'sci', label: 'Sci', type: SubjectType.MAIN },
  { key: 'sst', label: 'SST', type: SubjectType.MAIN },
  { key: 'comp', label: 'Comp', type: SubjectType.GRADING },
  { key: 'phy_edu', label: 'Phy Edu', type: SubjectType.GRADING },
];

export const ALL_CLASSES: ClassLevel[] = ['6', '7', '8', '9', '10'];

export const GET_SUBJECTS_FOR_CLASS = (classLevel: ClassLevel): SubjectConfig[] => {
  return MIDDLE_SCHOOL_CLASSES.includes(classLevel) ? MIDDLE_SUBJECTS : HIGH_SUBJECTS;
};

/**
 * Standardized key for marks storage: {exam}_{subject}
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  const type = String(examType || '').toLowerCase().trim();
  const sub = String(subjectKey || '').toLowerCase().trim();
  if (!type || !sub) return 'unassigned';
  return `${type}_${sub}`;
};

/**
 * Global Marks Rule Logic
 */
export const getExamMaxMarks = (examType: string | undefined, subject: any): number => {
  if (!examType || !subject) return 100;
  
  const type = String(examType).toLowerCase();
  const subKey = (typeof subject === 'string' ? subject : subject.key || '').toLowerCase().trim();
  const isPbiSpecial = subKey === 'pbi_a' || subKey === 'pbi_b';

  // 1. Bimonthly Rule
  if (type.includes('bimonthly')) return 20;

  // 2. Term / Preboard Rules
  if (type.includes('term') || type.includes('preboard')) {
    return isPbiSpecial ? 65 : 80;
  }

  // 3. Final Exam Rules
  if (type.includes('final')) {
    return isPbiSpecial ? 75 : 100;
  }

  return 100;
};
