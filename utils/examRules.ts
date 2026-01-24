import { ExamType, SubjectType, SubjectConfig, StudentMarks } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * Ensures that 'Final Exam' + 'Math' becomes 'final exam_math' to match user requirements.
 */
export const getMarkKey = (examType: string, subjectKey: string | number): string => {
  if (!examType || subjectKey === undefined || subjectKey === null || subjectKey === '') return 'pending_key';
  return `${examType.toLowerCase()}_${String(subjectKey).toLowerCase()}`;
};

export const getExamMaxMarks = (examType: string, subject: any): number => {
  const subKey = typeof subject === 'string' ? subject : subject?.key;
  
  // Use strictly defined labels or keys
  if (examType === 'Bimonthly') return 20;
  if (examType === 'Term Exam' || examType === 'Preboard') return 80;
  if (examType === 'Final Exam') {
    // Special Logic: Punjabi A/B in Final is 75 marks
    if (subKey === 'pbi_a' || subKey === 'pbi_b') return 75;
    return 100;
  }
  
  return 100;
};
