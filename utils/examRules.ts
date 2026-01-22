import { ExamType, SubjectType, SubjectConfig } from '../types';

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

export const getMarkKey = (examType: ExamType, subjectKey: string): string => {
  return `${examType}_${subjectKey}`;
};