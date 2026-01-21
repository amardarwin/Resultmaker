
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SchoolSetup: React.FC = () => {
  const { setupSchool } = useAuth();
  const [formData, setFormData] = useState({
    schoolName: '',
    adminName: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminPassword !== formData.confirmPassword) return alert('Passwords do not match');
    if (formData.adminPassword.length < 4) return alert('Password too short');

    setupSchool({
      schoolName: formData.schoolName,
      adminName: formData.adminName,
      adminPassword: formData.adminPassword,
      isSetup: true
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-12 rounded-[48px] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[32px] mx-auto flex items-center justify-center text-white text-5xl shadow-2xl rotate-6 mb-8">
            <i className="fa-solid fa-school"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-800">School Setup Wizard</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">Initial System Configuration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Official School Name</label>
              <input required type="text" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="e.g., St. Xavier's High School" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Principal / Admin Name</label>
              <input required type="text" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Admin Password</label>
              <input required type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="••••••••" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Confirm Password</label>
              <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="••••••••" />
            </div>
          </div>
          
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            INITIALIZE SYSTEM
          </button>
        </form>
      </div>
    </div>
  );
};

export default SchoolSetup;
