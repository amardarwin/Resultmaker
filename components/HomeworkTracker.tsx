import React, { useState, useEffect } from 'react';
import { HomeworkTask, ClassLevel, Role, StudentMarks } from '../types';
import { GET_SUBJECTS_FOR_CLASS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface HomeworkTrackerProps {
  classLevel: ClassLevel;
}

const HomeworkTracker: React.FC<HomeworkTrackerProps> = ({ classLevel }) => {
  const { user, canEditSubject } = useAuth();
  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState<Partial<HomeworkTask>>({
    taskName: '',
    subject: 'hindi',
    status: 'Assigned',
    nonSubmitters: []
  });

  const subjects = GET_SUBJECTS_FOR_CLASS(classLevel);
  const editableSubjects = subjects.filter(s => canEditSubject(s.key, classLevel));

  useEffect(() => {
    const saved: HomeworkTask[] = JSON.parse(localStorage.getItem('homework_tasks') || '[]');
    setTasks(saved.filter(t => t.classLevel === classLevel));
  }, [classLevel]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.taskName) return;

    const task: HomeworkTask = {
      id: Date.now().toString(),
      classLevel,
      subject: newTask.subject as keyof StudentMarks,
      taskName: newTask.taskName,
      date: new Date().toISOString().split('T')[0],
      status: 'Assigned',
      nonSubmitters: []
    };

    const allTasks: HomeworkTask[] = JSON.parse(localStorage.getItem('homework_tasks') || '[]');
    const updated = [task, ...allTasks];
    localStorage.setItem('homework_tasks', JSON.stringify(updated));
    setTasks(updated.filter(t => t.classLevel === classLevel));
    setNewTask({ taskName: '', subject: 'hindi', status: 'Assigned', nonSubmitters: [] });
    setShowAdd(false);
  };

  const updateStatus = (id: string, status: HomeworkTask['status']) => {
    const allTasks: HomeworkTask[] = JSON.parse(localStorage.getItem('homework_tasks') || '[]');
    const updated = allTasks.map(t => t.id === id ? { ...t, status } : t);
    localStorage.setItem('homework_tasks', JSON.stringify(updated));
    setTasks(updated.filter(t => t.classLevel === classLevel));
  };

  const deleteTask = (id: string) => {
    if (!confirm('Remove this task?')) return;
    const allTasks: HomeworkTask[] = JSON.parse(localStorage.getItem('homework_tasks') || '[]');
    const updated = allTasks.filter(t => t.id !== id);
    localStorage.setItem('homework_tasks', JSON.stringify(updated));
    setTasks(updated.filter(t => t.classLevel === classLevel));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Homework Tracker</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Checking Status & Non-Submitter Log</p>
         </div>
         {editableSubjects.length > 0 && (
           <button 
             onClick={() => setShowAdd(!showAdd)}
             className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
           >
             <i className={`fa-solid ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
             {showAdd ? 'CANCEL' : 'ASSIGN TASK'}
           </button>
         )}
      </div>

      {showAdd && (
        <form onSubmit={handleAddTask} className="bg-white p-8 rounded-[40px] border-2 border-indigo-100 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Task / Chapter Name</label>
                <input required type="text" value={newTask.taskName} onChange={e => setNewTask({...newTask, taskName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" placeholder="e.g., Chapter 1 Q&A Completion" />
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Select Subject</label>
                <select value={newTask.subject} onChange={e => setNewTask({...newTask, subject: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none">
                   {editableSubjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
             </div>
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
            SAVE TASK & NOTIFY
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 p-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
             <i className="fa-solid fa-file-signature text-5xl mb-4 opacity-20"></i>
             <p className="font-black uppercase tracking-widest text-sm">No tasks assigned for Class {classLevel}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{task.subject}</span>
                  <div className="flex gap-2">
                    <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs opacity-0 group-hover:opacity-100">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
               </div>
               <h4 className="text-xl font-black text-slate-800 mb-2">{task.taskName}</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Assigned: {task.date}</p>
               
               <div className="space-y-4">
                  <div className="flex gap-2">
                    {['Assigned', 'Checking', 'Completed'].map(status => (
                      <button 
                        key={status}
                        onClick={() => updateStatus(task.id, status as any)}
                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-tight transition-all ${task.status === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeworkTracker;
