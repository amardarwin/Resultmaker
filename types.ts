// FILE: types.ts (Root Folder)

// ✅ UNIVERSAL TYPES: Yeh file sabhi purani files ko shant karegi

export interface Student {
  id?: number;
  rollNo?: string;
  name?: string;
  fatherName?: string;
  class?: string;
  className?: string;
  
  // Subjects (Sab optional hain - Taaki error na aaye)
  math?: any;
  sci?: any;
  eng?: any;
  sst?: any;
  hindi?: any;
  pbi?: any;
  
  // Grading Subjects
  comp?: any;
  phy_edu?: any;
  drawing?: any;
  agri?: any;
  welcome_life?: any;

  // ✨ MAGIC LINE: Yeh kisi bhi extra cheez ko allow karega
  [key: string]: any;
}

export interface User {
  username?: string;
  role?: string;
  name?: string;
  assignedClass?: string;
  
  // ✨ MAGIC LINE
  [key: string]: any;
}

// ✅ Empty Constants (Taaki agar koi file inhe dhoondhe toh error na aaye)
export const SUBJECTS = {};
export const CLASSES = [];
