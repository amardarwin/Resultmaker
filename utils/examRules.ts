import { ExamType, SubjectType, SubjectConfig, StudentMarks } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * Ensures that 'Final' + 'Math' becomes 'final_math' to match user requirements.
 */
export const getMarkKey = (examType: string, subjectKey: string): string => {
  if (!examType || !subjectKey) return 'pending_key';
  return `${examType.toLowerCase()}_${subjectKey.toLowerCase()}`;
};

export const getExamMaxMarks = (examType: string, subject: any): number => {
  // Support both SubjectConfig objects and raw keys
  const subKey = typeof subject === 'string' ? subject : subject?.key;
  const isGrading = subject?.type === 'GRADING' || ['comp', 'phy_edu', 'agri'].includes(subKey);

  if (isGrading) {
    return 100; 
  }

  switch (examType) {
    case 'Bimonthly':
      return 20;
    case 'Term':
    case 'Preboard':
      return 80;
    case 'Final':
      if (subKey === 'pbi_a' || subKey === 'pbi_b') {
        return 75;
      }
      return 100;
    default:
      return 100;
  }
};
