import { ExamType, SubjectConfig } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
 * Ensures consistent lookup across the application.
 */
export const getMarkKey = (examType: string | undefined, subjectKey: string | number | undefined): string => {
  const safeExam = String(examType || '').trim().toLowerCase();
  const safeSubject = String(subjectKey || '').trim().toLowerCase();
  
  if (!safeExam || !safeSubject) {
    return 'unassigned_marks_registry';
  }
  return `${safeExam}_${safeSubject}`;
};

/**
 * Returns the maximum marks allowed for a specific exam and subject.
 * 
 * Rules for Middle School (6-8):
 * - Subject: 'pbi'
 * - Bimonthly: 20
 * - Term/Preboard: 80
 * - Final: 100
 * 
 * Rules for High School (9-10):
 * - Subjects: 'pbi_a', 'pbi_b'
 * - Bimonthly: 20
 * - Term/Preboard: 65
 * - Final: 75
 * 
 * General Main Subjects:
 * - Bimonthly: 20
 * - Term/Preboard: 80
 * - Final: 100
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = typeof subject === 'string' ? subject.toLowerCase() : String(subject.key).toLowerCase();
  const type = String(examType);

  // Requirement: Bimonthly is always 20 for all subjects across all levels
  if (type === ExamType.BIMONTHLY) return 20;

  // Requirement: Distinguish between High School Punjabi (A/B) and Middle/Other subjects
  const isHighSchoolPbi = subKey === 'pbi_a' || subKey === 'pbi_b';

  // Rule 2: Term/Preboard exams
  if (type === ExamType.TERM || type === ExamType.PREBOARD) {
    // High School Punjabi is 65, everything else (including Middle Pbi) is 80
    return isHighSchoolPbi ? 65 : 80;
  }

  // Rule 3: Final Exam logic
  if (type === ExamType.FINAL) {
    // High School Punjabi is 75, everything else (including Middle Pbi) is 100
    return isHighSchoolPbi ? 75 : 100;
  }

  return 100;
};
