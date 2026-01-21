
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role, StaffUser, StudentMarks } from '../types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from '../constants';

const StaffManagement: React.FC = () => {
  const { staffUsers, addStaff, updateStaff, removeStaff } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<StaffUser>>({
    name: '',
    username: '',
    password: '',
    role: Role.CLASS_INCHARGE,
    assignedClass: '10',
    assignedSubjects: []
  });

  // Get a master list of all unique subjects available across school levels
  const masterSubjects = [
    ...GET_SUBJECTS_FOR_CLASS('8'), 
    ...GET_SUBJECTS_FOR_CLASS('10')
  ].filter((v, i, a) => a.findIndex(t => t.key === v.key) === i);

  const handleEditClick = (user: StaffUser) => {
    setEditingUserId(user.id);
    setFormData({
      ...user,
      assignedSubjects: user.assignedSubjects || []
    });
    setShowForm(true);
  };

  const toggleSubject = (key: keyof StudentMarks) => {
    const current = formData.assignedSubjects || [];
    if (current.includes(key)) {
      setFormData({ ...formData, assignedSubjects: current.filter(s => s !== key) });
    } else {
      setFormData({ ...formData, assignedSubjects: [...current, key] });
    }
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
      assignedSubjects: formData.assignedSubjects || []
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
    setFormData({ name: '', username: '', password: '', role: Role.CLASS_INCHARGE, assignedSubjects: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Staff Directory</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1">Manage Teacher Access & Multi-Subject Assignment</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Password</label>
                <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-indigo-100 rounded-xl font-bold focus:border-indigo-500 outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold focus:border-indigo-500 outline-none">
                  <option value={Role.CLASS_INCHARGE}>Class Incharge</option>
                  <option value={Role.SUBJECT_TEACHER}>Subject Teacher</option>
                </select>
              </div>
              {formData.role === Role.CLASS_INCHARGE && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Assigned Class (Full Control)</label>
                  <select value={formData.assignedClass} onChange={e => setFormData({...formData, assignedClass: e.target.value as any})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold focus:border-indigo-500 outline-none">
                    {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase text-xs tracking-wider">
                  {editingUserId ? 'Update User' : 'Save User'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 flex justify-between">
                 Assigned Subjects
                 <span className="text-indigo-500">{formData.assignedSubjects?.length || 0} Selected</span>
               </label>
               <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {masterSubjects.map(sub => (
                    <label key={sub.key} className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${formData.assignedSubjects?.includes(sub.key) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={formData.assignedSubjects?.includes(sub.key)} 
                        onChange={() => toggleSubject(sub.key)}
                      />
                      <i className={`fa-solid ${formData.assignedSubjects?.includes(sub.key) ? 'fa-check-circle' : 'fa-circle-plus opacity-30'} text-xs`}></i>
                      <span className="text-[10px] font-black uppercase truncate">{sub.label}</span>
                    </label>
                  ))}
               </div>
               <p className="mt-4 text-[9px] font-bold text-slate-400 leading-tight uppercase">
                 Note: Subject Teachers can only edit marks for assigned subjects across all classes.
               </p>
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
              <th className="px-6 py-4">Incharge Of</th>
              <th className="px-6 py-4">Subjects Assigned</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">No staff users created yet.</td></tr>
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
                  <td className="px-6 py-4 font-black text-slate-600">
                    {user.assignedClass ? `Class ${user.assignedClass}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.assignedSubjects && user.assignedSubjects.length > 0 ? (
                        user.assignedSubjects.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded uppercase">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">None</span>
                      )}
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
