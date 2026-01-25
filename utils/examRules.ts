import { ExamType, SubjectConfig } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * e.g., 'Final Exam' + 'Math' -> 'final exam_math'
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  if (!examType || !subjectKey || String(subjectKey).trim() === '') {
    return 'invalid_registry_key';
  }
  return `${String(examType).toLowerCase()}_${String(subjectKey).toLowerCase()}`;
};

/**
 * Returns the maximum marks allowed for a specific exam and subject.
 * 
 * Rules for Punjabi:
 * - High School (9-10) [keys: pbi_a, pbi_b]: Bimonthly: 20, Term/Preboard: 65, Final: 75.
 * - Middle School (6-8) [key: pbi]: Bimonthly: 20, Term/Preboard: 80, Final: 100.
 * 
 * General Rules:
 * - Bimonthly: 20 for all subjects.
 * - Term/Preboard: 80 for non-HS Punjabi main subjects.
 * - Final: 100 for non-HS Punjabi main subjects.
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = typeof subject === 'string' ? subject.toLowerCase() : String(subject.key).toLowerCase();
  const type = String(examType);

  // Identify High School Punjabi specific papers (pbi_a and pbi_b only exist in 9-10)
  const isHighSchoolPbi = subKey === 'pbi_a' || subKey === 'pbi_b';

  // Rule 1: Bimonthly tests are always 20 for all main subjects across all levels
  if (type === ExamType.BIMONTHLY) return 20;

  // Rule 2: Term/Preboard exams
  if (type === ExamType.TERM || type === ExamType.PREBOARD) {
    // HS Punjabi capped at 65, others (including Middle Pbi) capped at 80
    return isHighSchoolPbi ? 65 : 80;
  }

  // Rule 3: Final Exam logic
  if (type === ExamType.FINAL) {
    // HS Punjabi capped at 75, others (including Middle Pbi) capped at 100
    return isHighSchoolPbi ? 75 : 100;
  }

  // Default fallback
  return 100;
};
