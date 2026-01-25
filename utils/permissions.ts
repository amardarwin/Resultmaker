import { User, Role, ClassLevel, StudentMarks } from '../types';

export type Permission = 'EDIT' | 'READ';

/**
 * Determines if a user has permission to modify marks for a specific subject in a specific class.
 */
export const getColumnPermission = (
  user: User | null, 
  currentClass: ClassLevel, 
  subject: string
): Permission => {
  if (!user) return 'READ';

  // 1. Admin Level
  if (user.role === Role.ADMIN) return 'EDIT';

  // 2. Class Incharge Level (Full access to their primary assigned class)
  if (user.role === Role.CLASS_INCHARGE && user.assignedClass === currentClass) {
    return 'EDIT';
  }

  // 3. Subject Assignment Level (Granular access to specific subjects in specific classes)
  const assignments = user.teachingAssignments || [];
  const assignment = assignments.find(a => a.classLevel === currentClass);
  if (assignment?.subjects.includes(subject)) {
    return 'EDIT';
  }

  return 'READ';
};

/**
 * Determines if a user can perform administrative tasks on a student record (Delete/Edit Info).
 */
export const canPerformAdminAction = (user: User | null, classLevel: ClassLevel): boolean => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.CLASS_INCHARGE && user.assignedClass === classLevel) return true;
  return false;
};
