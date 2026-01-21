
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, ClassLevel, StudentMarks, SchoolConfig, StaffUser, Student } from '../types';

interface AuthContextType {
  user: User | null;
  schoolConfig: SchoolConfig | null;
  staffUsers: StaffUser[];
  setupSchool: (config: SchoolConfig) => void;
  addStaff: (staff: StaffUser) => void;
  updateStaff: (staff: StaffUser) => void;
  removeStaff: (id: string) => void;
  login: (credentials: { username: string; pass: string; role: Role; classLevel?: ClassLevel; rollNo?: string }) => boolean;
  logout: () => void;
  canEditStudent: (classLevel: ClassLevel) => boolean;
  canEditSubject: (subjectKey: keyof StudentMarks, classLevel: ClassLevel) => boolean;
  isViewRestricted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edurank_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(() => {
    const saved = localStorage.getItem('school_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem('staff_users');
    return saved ? JSON.parse(saved) : [];
  });

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

  const login = (creds: { username: string; pass: string; role: Role; classLevel?: ClassLevel; rollNo?: string }): boolean => {
    let authUser: User | null = null;

    if (creds.role === Role.ADMIN) {
      if (creds.username === 'admin' && creds.pass === schoolConfig?.adminPassword) {
        authUser = { id: 'admin', username: 'admin', name: schoolConfig.adminName, role: Role.ADMIN };
      }
    } else if (creds.role === Role.CLASS_INCHARGE || creds.role === Role.SUBJECT_TEACHER) {
      const staff = staffUsers.find(s => s.username === creds.username && s.password === creds.pass && s.role === creds.role);
      if (staff) {
        const { password, ...safeUser } = staff;
        authUser = safeUser;
      }
    } else if (creds.role === Role.STUDENT) {
      const students: Student[] = JSON.parse(localStorage.getItem('school_results_students') || '[]');
      const student = students.find(s => s.classLevel === creds.classLevel && s.rollNo === creds.rollNo);
      const correctPassword = student?.password || '1234';
      if (student && creds.pass === correctPassword) {
        authUser = { id: student.id, username: student.rollNo, name: student.name, role: Role.STUDENT, assignedClass: student.classLevel, rollNo: student.rollNo };
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
    // Incharges can edit ALL subjects for their own class
    if (user.role === Role.CLASS_INCHARGE && user.assignedClass === classLevel) return true;
    // Subject teachers (or Hybrid Incharges) can edit columns that are in their assigned list
    if (user.assignedSubjects?.includes(subjectKey)) return true;
    return false;
  };

  const isViewRestricted = user?.role === Role.CLASS_INCHARGE || user?.role === Role.STUDENT;

  return (
    <AuthContext.Provider value={{ 
      user, schoolConfig, staffUsers, setupSchool, addStaff, updateStaff, removeStaff, login, logout, canEditStudent, canEditSubject, isViewRestricted 
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
