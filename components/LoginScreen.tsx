
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Fix: Moved ALL_CLASSES import to constants
import { Role } from '../types';
import { ALL_CLASSES } from '../constants';

const LoginScreen: React.FC = () => {
  const { schoolConfig, login } = useAuth();
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [creds, setCreds] = useState({
    username: '',
    pass: '',
    classLevel: '10' as any,
    rollNo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login({ ...creds, role });
    if (!success) alert('Invalid credentials or student record not found.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] mx-auto flex items-center justify-center text-white text-4xl shadow-xl rotate-6 mb-6">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800">{schoolConfig?.schoolName}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">EduRank Professional v5.0</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          {[Role.ADMIN, Role.CLASS_INCHARGE, Role.SUBJECT_TEACHER, Role.STUDENT].map(r => (
            <button 
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${role === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {role === Role.STUDENT ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Class</label>
                  <select value={creds.classLevel} onChange={e => setCreds({...creds, classLevel: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold">
                    {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Roll No</label>
                  <input type="text" value={creds.rollNo} onChange={e => setCreds({...creds, rollNo: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="001" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Password</label>
                <input type="password" value={creds.pass} onChange={e => setCreds({...creds, pass: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Default: 1234" required />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Username</label>
                <input type="text" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder={role === Role.ADMIN ? 'admin' : 'Username'} required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Password</label>
                <input type="password" value={creds.pass} onChange={e => setCreds({...creds, pass: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="••••••••" required />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">
            ACCESS PORTAL
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
