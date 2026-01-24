import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Role, ClassLevel } from '../types';

const AuthContext = createContext<any>(undefined);

const safeParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined" || item === "null") return fallback;
    return JSON.parse(item) || fallback;
  } catch (e) {
    console.warn(`AuthContext: Failed to parse ${key}`, e);
    return fallback;
  }
};

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(() => safeParse('edurank_active_session', null));
  const [schoolConfig, setSchoolConfig] = useState<any>(() => safeParse('school_config', null));
  const [staffUsers, setStaffUsers] = useState<any[]>(() => safeParse('staff_users', []));

  useEffect(() => {
    try {
      if (schoolConfig) localStorage.setItem('school_config', JSON.stringify(schoolConfig));
      localStorage.setItem('staff_users', JSON.stringify(staffUsers));
    } catch (e) {
      console.error("AuthContext: Persistence error", e);
    }
  }, [schoolConfig, staffUsers]);

  const setupSchool = (config: any) => setSchoolConfig(config);
  const addStaff = (staff: any) => setStaffUsers(prev => [...(prev || []), staff]);
  
  const updateStaff = (updatedStaff: any) => {
    setStaffUsers(prev => (prev || []).map(s => s.id === updatedStaff.id ? updatedStaff : s));
    if (user?.id === updatedStaff.id) {
      const { password, ...safeUser } = updatedStaff;
      setUser(safeUser);
      localStorage.setItem('edurank_active_session', JSON.stringify(safeUser));
    }
  };

  const removeStaff = (id: string) => setStaffUsers(prev => (prev || []).filter(s => s.id !== id));

  const login = (creds: any): boolean => {
    let authUser: any = null;
    try {
      if (creds.category === 'STAFF') {
        if (creds.username === 'admin' && creds.pass === schoolConfig?.adminPassword) {
          authUser = { id: 'admin', username: 'admin', name: schoolConfig.adminName || 'Administrator', role: Role.ADMIN };
        } else {
          const staff = (staffUsers || []).find(s => s.username === creds.username && s.password === creds.pass);
          if (staff) {
            const { password, ...safeUser } = staff;
            authUser = safeUser;
          }
        }
      } else {
        const students: any[] = safeParse('school_results_students', []);
        const student = students.find(s => s.classLevel === creds.classLevel && s.rollNo === creds.rollNo);
        if (student && creds.pass === (student.password || '1234')) {
          authUser = { id: student.id, username: student.rollNo, name: student.name, role: Role.STUDENT, assignedClass: student.classLevel, rollNo: student.rollNo };
        }
      }
    } catch (e) {
      return false;
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

  const accessibleClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === Role.ADMIN) return ['6', '7', '8', '9', '10'];
    const classes = new Set<string>();
    if (user.assignedClass) classes.add(user.assignedClass);
    if (user.teachingAssignments) {
      user.teachingAssignments.forEach((a: any) => {
        if (a && a.classLevel) classes.add(a.classLevel);
      });
    }
    return Array.from(classes) as ClassLevel[];
  }, [user]);

  const value = {
    user, schoolConfig, staffUsers, setupSchool, addStaff, updateStaff, removeStaff, login, logout,
    isViewRestricted: user?.role === Role.STUDENT,
    accessibleClasses,
    canEditStudent: (cls: string) => user?.role === Role.ADMIN || (user?.role === Role.CLASS_INCHARGE && user.assignedClass === cls),
    canEditSubject: (sub: string, cls: string) => {
      if (!user) return false;
      if (user.role === Role.ADMIN) return true;
      if (user.role === Role.CLASS_INCHARGE && user.assignedClass === cls) return true;
      // Handle potential undefined teachingAssignments
      const assignments = user.teachingAssignments || [];
      return assignments.some((a: any) => a.classLevel === cls && a.subjects && a.subjects.includes(sub));
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
