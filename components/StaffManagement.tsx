import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role, StaffUser, StudentMarks, ClassLevel, TeachingAssignment } from '../types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from '../constants';

const StaffManagement: React.FC = () => {
  const { staffUsers, addStaff, updateStaff, removeStaff } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Schedule Builder Temp States
  const [activeBuilderClass, setActiveBuilderClass] = useState<ClassLevel>('6');
  // Changed from (keyof StudentMarks)[] to string[] to resolve TS errors with string index signatures
  const [activeBuilderSubjects, setActiveBuilderSubjects] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<StaffUser>>({
    name: '',
    username: '',
    password: '',
    role: Role.CLASS_INCHARGE,
    assignedClass: '10',
    teachingAssignments: []
  });

  const availableSubjectsForClass = GET_SUBJECTS_FOR_CLASS(activeBuilderClass);

  const handleEditClick = (user: StaffUser) => {
    setEditingUserId(user.id);
    setFormData({
      ...user,
      teachingAssignments: user.teachingAssignments || []
    });
    setShowForm(true);
  };

  // Changed key type from keyof StudentMarks to string for broader compatibility
  const toggleBuilderSubject = (key: string) => {
    if (activeBuilderSubjects.includes(key)) {
      setActiveBuilderSubjects(prev => prev.filter(s => s !== key));
    } else {
      setActiveBuilderSubjects(prev => [...prev, key]);
    }
  };

  const addAssignmentToSchedule = () => {
    if (activeBuilderSubjects.length === 0) return alert("Select at least one subject.");
    
    const currentAssignments = formData.teachingAssignments || [];
    // If class already exists, merge subjects, else add new entry
    const existingIdx = currentAssignments.findIndex(a => a.classLevel === activeBuilderClass);
    
    let updated: TeachingAssignment[];
    if (existingIdx > -1) {
      const mergedSubjects = Array.from(new Set([...currentAssignments[existingIdx].subjects, ...activeBuilderSubjects]));
      updated = [...currentAssignments];
      updated[existingIdx] = { classLevel: activeBuilderClass, subjects: mergedSubjects };
    } else {
      updated = [...currentAssignments, { classLevel: activeBuilderClass, subjects: [...activeBuilderSubjects] }];
    }
    
    setFormData({ ...formData, teachingAssignments: updated });
    setActiveBuilderSubjects([]);
  };

  const removeAssignment = (classLevel: ClassLevel) => {
    setFormData({
      ...formData,
      teachingAssignments: formData.teachingAssignments?.filter(a => a.classLevel !== classLevel)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const staffData: StaffUser = {
      ...(editingUserId ? (formData as StaffUser) : {
        id: Date.now().toString(),
        name: formData.name!,
        username: formData.username!,
        password: formData.password!,
        role: formData.role!,
      } as StaffUser),
      assignedClass: formData.role === Role.CLASS_INCHARGE ? formData.assignedClass : undefined,
      teachingAssignments: formData.teachingAssignments || []
    };

    if (editingUserId) {
      updateStaff(staffData);
    } else {
      addStaff(staffData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUserId(null);
    setFormData({ name: '', username: '', password: '', role: Role.CLASS_INCHARGE, teachingAssignments: [] });
    setActiveBuilderSubjects([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Staff Directory</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1">Manage Teachers & Granular Class Schedules</p>
        </div>
        <button 
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
        >
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-user-plus'}`}></i>
          {showForm ? 'CANCEL' : 'CREATE USER'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-black text-indigo-600 uppercase mb-6 flex items-center gap-2">
            <i className={`fa-solid ${editingUserId ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
            {editingUserId ? 'Edit Staff Credentials' : 'Add New Staff Member'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Account Details</span>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Username</label>
                  <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Password</label>
                  <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none">
                    <option value={Role.CLASS_INCHARGE}>Class Incharge</option>
                    <option value={Role.SUBJECT_TEACHER}>Subject Teacher</option>
                  </select>
                </div>
                {formData.role === Role.CLASS_INCHARGE && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary Class</label>
                    <select value={formData.assignedClass} onChange={e => setFormData({...formData, assignedClass: e.target.value as any})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none">
                      {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase text-xs tracking-wider">
                {editingUserId ? 'Update Profile' : 'Finalize Staff'}
              </button>
            </div>

            {/* Teaching Schedule Builder */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                   <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Assignment Builder</span>
                   <span className="text-[10px] font-black text-slate-400">Step 1: Build Schedule Rows</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">1. Select Target Class</label>
                    <div className="flex gap-2 flex-wrap">
                      {ALL_CLASSES.map(cls => (
                        <button 
                          key={cls}
                          type="button"
                          onClick={() => { setActiveBuilderClass(cls); setActiveBuilderSubjects([]); }}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${activeBuilderClass === cls ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                        >
                          C-{cls}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">2. Pick Subjects (Class {activeBuilderClass})</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSubjectsForClass.map(sub => (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => toggleBuilderSubject(sub.key)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase text-left transition-all border ${activeBuilderSubjects.includes(sub.key) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          <i className={`fa-solid ${activeBuilderSubjects.includes(sub.key) ? 'fa-check' : 'fa-plus'} mr-1 opacity-50`}></i>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={addAssignmentToSchedule}
                  className="w-full py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-calendar-plus"></i>
                  Add to Teacher's Schedule
                </button>
              </div>

              {/* Active Assignments View */}
              <div className="flex-1 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Current Active Schedule</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(!formData.teachingAssignments || formData.teachingAssignments.length === 0) ? (
                    <div className="md:col-span-2 p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <i className="fa-solid fa-calendar-days text-3xl mb-2 opacity-30"></i>
                      <p className="text-[10px] font-black uppercase tracking-tighter">No teaching assignments added yet</p>
                    </div>
                  ) : (
                    formData.teachingAssignments.map(assignment => (
                      <div key={assignment.classLevel} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 relative group animate-in slide-in-from-right-4 duration-300">
                        <button 
                          onClick={() => removeAssignment(assignment.classLevel)}
                          className="absolute top-2 right-2 w-6 h-6 bg-white text-red-400 rounded-lg flex items-center justify-center text-xs shadow-sm hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Class {assignment.classLevel}</span>
                           <span className="text-[9px] font-bold text-indigo-400 uppercase">{assignment.subjects.length} Subjects</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {assignment.subjects.map(s => (
                            <span key={s} className="bg-white border border-indigo-100 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Responsibilities</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffUsers.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold italic">No staff users created yet.</td></tr>
            ) : (
              staffUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {user.assignedClass && (
                        <div className="flex items-center gap-1">
                          <i className="fa-solid fa-star text-[8px] text-yellow-500"></i>
                          <span className="text-[10px] font-black text-slate-600 uppercase">Incharge: Class {user.assignedClass}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {user.teachingAssignments && user.teachingAssignments.length > 0 ? (
                          user.teachingAssignments.map(a => (
                            <div key={a.classLevel} className="flex items-center bg-slate-100 rounded-md px-1.5 py-0.5 border border-slate-200">
                               <span className="text-[9px] font-black text-slate-400 mr-1">C-{a.classLevel}:</span>
                               <span className="text-[9px] font-black text-slate-800 uppercase">{a.subjects.join(', ')}</span>
                            </div>
                          ))
                        ) : (
                          !user.assignedClass && <span className="text-slate-300 italic text-[10px]">No Assignments</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(user)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => confirm(`Permanently delete ${user.name}?`) && removeStaff(user.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagement;