import { ExamType, SubjectConfig } from '../types';

/**
 * Generates a standardized lowercase key for marks storage.
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
 * Logic Requirements:
 * 1. Bimonthly: 20 for ALL subjects.
 * 2. High School (9-10) Punjabi (keys: pbi_a, pbi_b): Term/Preboard: 65, Final: 75.
 * 3. Middle School (6-8) Punjabi (key: pbi): Term/Preboard: 80, Final: 100.
 * 4. General Main Subjects: Term/Preboard: 80, Final: 100.
 */
export const getExamMaxMarks = (examType: string | undefined, subject: SubjectConfig | string | undefined): number => {
  if (!examType || !subject) return 100;
  
  const subKey = typeof subject === 'string' ? subject.toLowerCase() : String(subject.key).toLowerCase();
  const type = String(examType);

  // Requirement: Bimonthly is always 20
  if (type === ExamType.BIMONTHLY) return 20;

  // Requirement: Identify High School Punjabi Variations
  const isHighSchoolPbi = subKey === 'pbi_a' || subKey === 'pbi_b';

  // Rule 2: Term/Preboard exams (HS Pbi: 65, others: 80)
  if (type === ExamType.TERM || type === ExamType.PREBOARD) {
    return isHighSchoolPbi ? 65 : 80;
  }

  // Rule 3: Final Exam logic (HS Pbi: 75, others: 100)
  if (type === ExamType.FINAL) {
    return isHighSchoolPbi ? 75 : 100;
  }

  return 100;
};
