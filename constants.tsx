
import { ClassLevel, SubjectConfig, SubjectType } from './types';

export const MIDDLE_SCHOOL_CLASSES: ClassLevel[] = ['6', '7', '8'];
export const HIGH_SCHOOL_CLASSES: ClassLevel[] = ['9', '10'];

export const MIDDLE_SUBJECTS: SubjectConfig[] = [
  { key: 'pbi', label: 'Pbi', type: SubjectType.MAIN },
  { key: 'hindi', label: 'Hindi', type: SubjectType.MAIN },
  { key: 'eng', label: 'Eng', type: SubjectType.MAIN },
  { key: 'math', label: 'Math', type: SubjectType.MAIN },
  { key: 'sci', label: 'Sci', type: SubjectType.MAIN },
  { key: 'sst', label: 'SST', type: SubjectType.MAIN },
  { key: 'comp', label: 'Comp', type: SubjectType.MAIN },
  { key: 'phy_edu', label: 'Phy Edu', type: SubjectType.GRADING },
  { key: 'agri', label: 'Agri', type: SubjectType.GRADING },
];

export const HIGH_SUBJECTS: SubjectConfig[] = [
  { key: 'pbi_a', label: 'Pbi A', type: SubjectType.MAIN },
  { key: 'pbi_b', label: 'Pbi B', type: SubjectType.MAIN },
  { key: 'hindi', label: 'Hindi', type: SubjectType.MAIN },
  { key: 'eng', label: 'Eng', type: SubjectType.MAIN },
  { key: 'math', label: 'Math', type: SubjectType.MAIN },
  { key: 'sci', label: 'Sci', type: SubjectType.MAIN },
  { key: 'sst', label: 'SST', type: SubjectType.MAIN },
  { key: 'comp', label: 'Comp', type: SubjectType.MAIN },
  { key: 'phy_edu', label: 'Phy Edu', type: SubjectType.GRADING },
];

export const ALL_CLASSES: ClassLevel[] = ['6', '7', '8', '9', '10'];

export const GET_SUBJECTS_FOR_CLASS = (classLevel: ClassLevel): SubjectConfig[] => {
  return MIDDLE_SCHOOL_CLASSES.includes(classLevel) ? MIDDLE_SUBJECTS : HIGH_SUBJECTS;
};

export const MAX_MARKS_PER_SUBJECT = 100;
