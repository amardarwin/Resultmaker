import { ExamType, SubjectConfig, SubjectType } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * e.g., 'final exam_math'
 * This ensures that marks for different exams are stored separately within the student's marks object.
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  const type = String(examType || '').toLowerCase().trim();
  const key = String(subjectKey || '').toLowerCase().trim();
  
  if (!type || !key) {
    return 'unassigned_registry_key';
  }
  return `${type}_${key}`;
};

/**
 * Returns the maximum marks allowed for a specific exam and subject.
 * 
 * Rules:
 * 1. Bimonthly: 20 for all subjects regardless of class level.
 * 2. High School (9-10) Punjabi Specific Papers (pbi_a, pbi_b): 
 *    - Term/Preboard: 65
 *    - Final: 75
 * 3. Middle School (6-8) Punjabi (pbi) and all other Main subjects (Math, Sci, etc.):
 *    - Term/Preboard: 80
 *    - Final: 100
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = (typeof subject === 'string' ? subject : subject.key).toLowerCase().trim();
  const type = String(examType);

  // Rule 1: Bimonthly tests are always out of 20
  if (type === ExamType.BIMONTHLY) {
    return 20;
  }

  // Rule 2: Identify High School Punjabi Specific Papers
  // Note: 'pbi_a' and 'pbi_b' are keys for Class 9-10 Punjabi Papers
  const isHighSchoolPunjabi = subKey === 'pbi_a' || subKey === 'pbi_b';

  // Rule 3: Term and Preboard Exams
  if (type === ExamType.TERM || type === ExamType.PREBOARD) {
    return isHighSchoolPunjabi ? 65 : 80;
  }

  // Rule 4: Final Exams
  if (type === ExamType.FINAL) {
    return isHighSchoolPunjabi ? 75 : 100;
  }

  // Default fallback for any other exam types
  return 100;
};
