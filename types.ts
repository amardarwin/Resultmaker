export type ClassLevel = '6' | '7' | '8' | '9' | '10';

export enum Role {
  ADMIN = 'ADMIN',
  CLASS_INCHARGE = 'CLASS_INCHARGE',
  SUBJECT_TEACHER = 'SUBJECT_TEACHER',
  STUDENT = 'STUDENT'
}

export enum ExamType {
  BIMONTHLY = 'Bimonthly',
  TERM = 'Term',
  PREBOARD = 'Preboard',
  FINAL = 'Final'
}

export interface TeachingAssignment {
  classLevel: ClassLevel;
  subjects: (keyof StudentMarks)[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  assignedClass?: ClassLevel;
  teachingAssignments?: TeachingAssignment[];
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
  [key: string]: number | undefined;
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
  fatherName?: string;
  classLevel: ClassLevel;
  marks: Record<string, number>;
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

export type AttendanceStatus = 'P' | 'A' | 'L';

export interface AttendanceRecord {
  date: string;
  classLevel: ClassLevel;
  records: Record<string, AttendanceStatus>; // rollNo -> status
}

export interface HomeworkTask {
  id: string;
  classLevel: ClassLevel;
  subject: keyof StudentMarks;
  taskName: string;
  date: string;
  status: 'Assigned' | 'Checking' | 'Completed';
  nonSubmitters: string[]; // array of roll numbers
}
