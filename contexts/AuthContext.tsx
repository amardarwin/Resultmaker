import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, ClassLevel, StudentMarks, SchoolConfig, StaffUser, Student, TeachingAssignment } from '../types';

interface AuthContextType {
  user: User | null;
  schoolConfig: SchoolConfig | null;
  staffUsers: StaffUser[];
  setupSchool: (config: SchoolConfig) => void;
  addStaff: (staff: StaffUser) => void;
  updateStaff: (staff: StaffUser) => void;
  removeStaff: (id: string) => void;
  login: (credentials: { 
    category: 'STAFF' | 'STUDENT';
    username?: string; 
    pass: string; 
    classLevel?: ClassLevel; 
    rollNo?: string 
  }) => boolean;
  logout: () => void;
  canEditStudent: (classLevel: ClassLevel) => boolean;
  canEditSubject: (subjectKey: keyof StudentMarks, classLevel: ClassLevel) => boolean;
  isViewRestricted: boolean;
  accessibleClasses: ClassLevel[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined") return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => safeParse('edurank_active_session', null));
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(() => safeParse('school_config', null));
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => safeParse('staff_users', []));

  useEffect(() => {
    if (schoolConfig) localStorage.setItem('school_config', JSON.stringify(schoolConfig));
    localStorage.setItem('staff_users', JSON.stringify(staffUsers));
  }, [schoolConfig, staffUsers]);

  const setupSchool = (config: SchoolConfig) => {
    setSchoolConfig(config);
  };

  const addStaff = (staff: StaffUser) => {
    setStaffUsers(prev => [...prev, staff]);
  };

  const updateStaff = (updatedStaff: StaffUser) => {
    setStaffUsers(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    if (user?.id === updatedStaff.id) {
      const { password, ...safeUser } = updatedStaff;
      setUser(safeUser);
      localStorage.setItem('edurank_active_session', JSON.stringify(safeUser));
    }
  };

  const removeStaff = (id: string) => {
    setStaffUsers(prev => prev.filter(s => s.id !== id));
  };

  const login = (creds: { 
    category: 'STAFF' | 'STUDENT';
    username?: string; 
    pass: string; 
    classLevel?: ClassLevel; 
    rollNo?: string 
  }): boolean => {
    let authUser: User | null = null;

    if (creds.category === 'STAFF') {
      if (creds.username === 'admin' && creds.pass === schoolConfig?.adminPassword) {
        authUser = { id: 'admin', username: 'admin', name: schoolConfig.adminName, role: Role.ADMIN };
      } else {
        const staff = staffUsers.find(s => s.username === creds.username && s.password === creds.pass);
        if (staff) {
          const { password, ...safeUser } = staff;
          authUser = safeUser;
        }
      }
    } else {
      const students: Student[] = safeParse('school_results_students', []);
      const student = students.find(s => s.classLevel === creds.classLevel && s.rollNo === creds.rollNo);
      const correctPassword = student?.password || '1234';
      if (student && creds.pass === correctPassword) {
        authUser = { 
          id: student.id, 
          username: student.rollNo, 
          name: student.name, 
          role: Role.STUDENT, 
          assignedClass: student.classLevel, 
          rollNo: student.rollNo 
        };
      }
    }

    if (authUser) {
      setUser(authUser);
      localStorage.setItem('edurank_active_session', JSON.stringify(authUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edurank_active_session');
  };

  const canEditStudent = (classLevel: ClassLevel): boolean => {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.CLASS_INCHARGE && user.assignedClass === classLevel) return true;
    return false;
  };

  const canEditSubject = (subjectKey: keyof StudentMarks, classLevel: ClassLevel): boolean => {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.CLASS_INCHARGE && user.assignedClass === classLevel) return true;
    const assignment = user.teachingAssignments?.find(a => a.classLevel === classLevel);
    if (assignment?.subjects.includes(subjectKey)) return true;
    return false;
  };

  const isViewRestricted = user?.role === Role.STUDENT;

  const accessibleClasses = React.useMemo(() => {
    if (!user) return [];
    if (user.role === Role.ADMIN) return ['6', '7', '8', '9', '10'] as ClassLevel[];
    const classes = new Set<ClassLevel>();
    if (user.assignedClass) classes.add(user.assignedClass);
    user.teachingAssignments?.forEach(a => classes.add(a.classLevel));
    return Array.from(classes);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, schoolConfig, staffUsers, setupSchool, addStaff, updateStaff, removeStaff, login, logout, canEditStudent, canEditSubject, isViewRestricted, accessibleClasses 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
