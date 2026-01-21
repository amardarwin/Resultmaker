
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Fix: Moved ALL_CLASSES import to constants
import { Role, StaffUser } from '../types';
import { ALL_CLASSES, GET_SUBJECTS_FOR_CLASS } from '../constants';

const StaffManagement: React.FC = () => {
  const { staffUsers, addStaff, removeStaff } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffUser>>({
    name: '',
    username: '',
    password: '',
    role: Role.CLASS_INCHARGE,
    assignedClass: '10',
    assignedSubject: 'math'
  });

  const subjects = GET_SUBJECTS_FOR_CLASS('10'); // Sample list

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffUser = {
      id: Date.now().toString(),
      name: formData.name!,
      username: formData.username!,
      password: formData.password!,
      role: formData.role!,
      assignedClass: formData.role === Role.CLASS_INCHARGE ? formData.assignedClass : undefined,
      assignedSubject: formData.role === Role.SUBJECT_TEACHER ? formData.assignedSubject : undefined,
    };
    addStaff(newStaff);
    setShowForm(false);
    setFormData({ name: '', username: '', password: '', role: Role.CLASS_INCHARGE });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Staff Directory</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1">Manage Teacher Access & Permissions</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
        >
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-user-plus'}`}></i>
          {showForm ? 'CANCEL' : 'CREATE USER'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Username</label>
              <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                <option value={Role.CLASS_INCHARGE}>Class Incharge</option>
                <option value={Role.SUBJECT_TEACHER}>Subject Teacher</option>
              </select>
            </div>
            {formData.role === Role.CLASS_INCHARGE ? (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Assigned Class</label>
                <select value={formData.assignedClass} onChange={e => setFormData({...formData, assignedClass: e.target.value as any})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                  {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Assigned Subject</label>
                <select value={formData.assignedSubject} onChange={e => setFormData({...formData, assignedSubject: e.target.value as any})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                  {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl">SAVE USER</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">No staff users created yet.</td></tr>
            ) : (
              staffUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800">{user.name}</td>
                  <td className="px-6 py-4 font-bold text-slate-500">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-600">
                    {user.role === Role.CLASS_INCHARGE ? `Class ${user.assignedClass}` : `Subject: ${user.assignedSubject}`}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => removeStaff(user.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <i className="fa-solid fa-trash"></i>
                    </button>
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
