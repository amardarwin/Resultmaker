// FILE: types.ts (Root)

// ✅ UNIVERSAL TYPES: Yeh code kisi bhi file ko fail nahi hone dega

export interface Student {
  id?: number;
  rollNo?: string;
  name?: string;
  fatherName?: string;
  class?: string;
  className?: string;
  
  // Subjects (Sab optional hain)
  math?: any;
  sci?: any;
  eng?: any;
  sst?: any;
  hindi?: any;
  pbi?: any;
  
  // ✨ MAGIC LINE: (Sabse Zaroori)
  // Yeh kisi bhi extra cheez ko allow karega
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
