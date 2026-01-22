// FILE: types.ts

export interface Student {
  id: number;
  rollNo: string;
  name: string;
  fatherName: string;
  motherName?: string;
  category?: string;
  dob?: string;
  className?: string; 
  class?: string;

  // Subjects (Purane Wale)
  pbi?: string | number;
  math?: string | number;
  sci?: string | number;
  sst?: string | number;
  eng?: string | number;
  hindi?: string | number;

  // Grading Subjects
  comp?: string | number;
  phy_edu?: string | number;
  drawing?: string | number;
  agri?: string | number;
  welcome_life?: string | number;

  // ✨ MAGIC LINE (Yeh line error hatayegi)
  // Iska matlab hai: "Koi bhi naya subject ya exam type (jaise bimonthly_math) aane do, roko mat."
  [key: string]: any;
}

export interface User {
  username: string;
  role: 'ADMIN' | 'CLASS_INCHARGE' | 'SUBJECT_TEACHER' | 'STUDENT';
  name: string;
  assignedClass?: string;
  teachingAssignments?: { class: string, subjects: string[] }[];
}
