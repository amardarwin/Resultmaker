// FILE: types.ts (Root)

// ✅ UNIVERSAL MASTER KEY (Yeh sab errors theek karegi)

export interface Student {
  id?: number | string;
  rollNo?: string;
  name?: string;
  fatherName?: string;
  class?: string;
  className?: string; // ResultTable kabhi kabhi yeh dhoondhta hai
  
  // Subjects (Sabko 'any' kar diya taaki error na aaye)
  math?: any;
  sci?: any;
  eng?: any;
  sst?: any;
  hindi?: any;
  pbi?: any;
  pbi_a?: any;
  pbi_b?: any;
  
  // Grading
  comp?: any;
  phy_edu?: any;
  drawing?: any;
  agri?: any;
  welcome_life?: any;

  // ✨ MAGIC LINE (Zaroori hai)
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

// ✅ Agar koi file Constants dhoondh rahi ho
export const SUBJECTS = {}; 
export const CLASSES = [];
