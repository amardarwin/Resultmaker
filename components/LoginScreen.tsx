import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ALL_CLASSES } from '../constants';

const LoginScreen: React.FC = () => {
  const { schoolConfig, login } = useAuth();
  const [tab, setTab] = useState<'STAFF' | 'STUDENT'>('STAFF');
  const [creds, setCreds] = useState({
    username: '',
    pass: '',
    classLevel: '10' as any,
    rollNo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login({ ...creds, category: tab });
    if (!success) alert('Invalid credentials. Please verify your details.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] mx-auto flex items-center justify-center text-white text-4xl shadow-xl rotate-6 mb-6">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800">{schoolConfig?.schoolName || 'EduRank Pro'}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Professional Result Management v5.0</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button 
            onClick={() => setTab('STAFF')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${tab === 'STAFF' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            <i className="fa-solid fa-user-tie"></i>
            Staff Login
          </button>
          <button 
            onClick={() => setTab('STUDENT')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${tab === 'STUDENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            <i className="fa-solid fa-user-graduate"></i>
            Student Portal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {tab === 'STUDENT' ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Class</label>
                  <select value={creds.classLevel} onChange={e => setCreds({...creds, classLevel: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none">
                    {ALL_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Roll No</label>
                  <input type="text" value={creds.rollNo} onChange={e => setCreds({...creds, rollNo: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" placeholder="001" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Password</label>
                <input type="password" value={creds.pass} onChange={e => setCreds({...creds, pass: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" placeholder="Default: 1234" required />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Username / ID</label>
                <input type="text" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" placeholder="Enter credentials" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Password</label>
                <input type="password" value={creds.pass} onChange={e => setCreds({...creds, pass: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" placeholder="••••••••" required />
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
            <span>SECURE ACCESS</span>
            <i className="fa-solid fa-arrow-right-to-bracket text-sm opacity-50"></i>
          </button>
        </form>
        
        <p className="mt-8 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          End-to-End Encrypted Authentication
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;