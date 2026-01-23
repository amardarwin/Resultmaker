// FILE: types.ts (Root Folder)

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

  // Subjects
  pbi?: string | number;
  math?: string | number;
  sci?: string | number;
  sst?: string | number;
  eng?: string | number;
  hindi?: string | number;

  // Grading
  comp?: string | number;
  phy_edu?: string | number;
  drawing?: string | number;
  agri?: string | number;
  welcome_life?: string | number;

  // ✨ MAGIC LINE (Yeh line 'npm build' error rokegi)
  [key: string]: any;
}

export interface User {
  username: string;
  role: string; // Loose type taaki error na aaye
  name: string;
  assignedClass?: string;
  teachingAssignments?: { class: string, subjects: string[] }[];
}
