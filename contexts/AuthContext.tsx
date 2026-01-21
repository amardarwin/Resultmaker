
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role, ClassLevel, StudentMarks } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  canEditStudent: (classLevel: ClassLevel) => boolean;
  canEditSubject: (subjectKey: keyof StudentMarks, classLevel: ClassLevel) => boolean;
  isViewRestricted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edurank_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username: string, pass: string): boolean => {
    let authenticatedUser: User | null = null;

    if (username === 'head' && pass === 'admin') {
      authenticatedUser = { username: 'Head', role: Role.ADMIN };
    } else if (username === 'incharge10' && pass === '123') {
      authenticatedUser = { username: 'Class Incharge (10th)', role: Role.CLASS_INCHARGE, assignedClass: '10' };
    } else if (username === 'mathsir' && pass === '123') {
      authenticatedUser = { username: 'Math Teacher', role: Role.SUBJECT_TEACHER, assignedSubject: 'math' };
    } else if (username === '1' && pass === 'pass') {
      authenticatedUser = { username: 'Student 1', role: Role.STUDENT, rollNo: '1' };
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('edurank_auth', JSON.stringify(authenticatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edurank_auth');
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
    if (user.role === Role.SUBJECT_TEACHER && user.assignedSubject === subjectKey) return true;
    return false;
  };

  const isViewRestricted = user?.role === Role.CLASS_INCHARGE || user?.role === Role.STUDENT;

  return (
    <AuthContext.Provider value={{ user, login, logout, canEditStudent, canEditSubject, isViewRestricted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
