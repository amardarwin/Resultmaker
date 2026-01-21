
export type ClassLevel = '6' | '7' | '8' | '9' | '10';

export enum Role {
  ADMIN = 'ADMIN',
  CLASS_INCHARGE = 'CLASS_INCHARGE',
  SUBJECT_TEACHER = 'SUBJECT_TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  assignedClass?: ClassLevel;
  assignedSubjects?: (keyof StudentMarks)[]; // Now supports multiple subjects
  rollNo?: string;
}

export interface StaffUser extends User {
  password?: string;
}

export interface SchoolConfig {
  schoolName: string;
  adminName: string;
  adminPassword?: string;
  isSetup: boolean;
}

export interface StudentMarks {
  pbi?: number;
  pbi_a?: number;
  pbi_b?: number;
  hindi: number;
  eng: number;
  math: number;
  sci: number;
  sst: number;
  comp: number;
  phy_edu: number;
  agri?: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  classLevel: ClassLevel;
  marks: StudentMarks;
  manualTotal?: number;
  password?: string;
}

export interface CalculatedResult extends Student {
  total: number;
  percentage: number;
  rank: number;
  status: 'Pass' | 'Fail';
}

export enum SubjectType {
  MAIN = 'MAIN',
  GRADING = 'GRADING'
}

export interface SubjectConfig {
  key: keyof StudentMarks;
  label: string;
  type: SubjectType;
}

export interface ColumnMapping {
  rollNo: string;
  name: string;
  subjectMapping: Record<string, string>;
}
