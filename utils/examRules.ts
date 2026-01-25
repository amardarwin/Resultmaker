import { ExamType, SubjectConfig } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * e.g., 'final exam_math'
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  const type = String(examType || '').toLowerCase().trim();
  const key = String(subjectKey || '').toLowerCase().trim();
  
  if (!type || !key) return 'unassigned_registry_key';
  return `${type}_${key}`;
};

/**
 * Returns the maximum marks allowed for a specific exam and subject.
 * 
 * Rules:
 * 1. Bimonthly: 20 for all subjects.
 * 2. High School (9-10) Punjabi (pbi_a, pbi_b): Term/Preboard: 65, Final: 75.
 * 3. Middle School (6-8) Punjabi (pbi) and all other main subjects: Term/Preboard: 80, Final: 100.
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = (typeof subject === 'string' ? subject : subject.key).toLowerCase().trim();
  const type = String(examType);

  // Rule 1: Bimonthly is always 20
  if (type === ExamType.BIMONTHLY) return 20;

  // Rule 2: High School Punjabi Specific Papers
  const isHSPunjabi = subKey === 'pbi_a' || subKey === 'pbi_b';

  // Rule 3: Term/Preboard Marks
  if (type === ExamType.TERM || type === ExamType.PREBOARD) {
    return isHSPunjabi ? 65 : 80;
  }

  // Rule 4: Final Exam Marks
  if (type === ExamType.FINAL) {
    return isHSPunjabi ? 75 : 100;
  }

  return 100;
};
