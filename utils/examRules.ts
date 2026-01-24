import { ExamType, SubjectConfig } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * e.g., 'Final Exam' + 'Math' -> 'final exam_math'
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  if (!examType || subjectKey === undefined || subjectKey === null) return 'unknown_key';
  return `${String(examType).toLowerCase()}_${String(subjectKey).toLowerCase()}`;
};

/**
 * Returns the maximum marks allowed for a specific exam and subject.
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = typeof subject === 'string' ? subject.toLowerCase() : String(subject.key).toLowerCase();
  const type = String(examType);

  // Rule 1: Bimonthly tests are always 20
  if (type === 'Bimonthly') return 20;

  // Rule 2: Term/Preboard exams are always 80
  if (type === 'Term Exam' || type === 'Preboard') return 80;

  // Rule 3: Final Exam specific logic
  if (type === 'Final Exam') {
    if (subKey === 'pbi_a' || subKey === 'pbi_b') return 75;
    return 100;
  }

  return 100;
};
