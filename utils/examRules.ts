import { ExamType, SubjectType, SubjectConfig, StudentMarks } from '../types';

/**
 * Generates a unique key for marks storage based on exam type and subject key.
 * Update getMarkKey to handle keyof StudentMarks which can be string | number due to index signature.
 */
export const getMarkKey = (examType: ExamType, subjectKey: keyof StudentMarks | string): string => {
  return `${examType}_${String(subjectKey)}`;
};

export const getExamMaxMarks = (examType: ExamType, subject: SubjectConfig): number => {
  // Grading subjects logic
  if (subject.type === SubjectType.GRADING) {
    return 100; // Standard for grading subjects unless specified
  }

  // Main subjects logic
  switch (examType) {
    case ExamType.BIMONTHLY:
      return 20;
    case ExamType.TERM:
    case ExamType.PREBOARD:
      return 80;
    case ExamType.FINAL:
      if (subject.key === 'pbi_a' || subject.key === 'pbi_b') {
        return 75;
      }
      return 100;
    default:
      return 100;
  }
};
