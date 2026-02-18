import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { EmployeeStatus, ProjectStatus, TaskPriority } from '../types';

const AssignTask: React.FC = () => {
  const { employees, projects, addTask } = useData();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const dc = dark;

  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE);
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);

  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !projectId || !title || !dueDate) return;
    addTask({ assignedToId: assigneeId, projectId, title, description: description || '', status: 'Todo' as any, priority, dueDate });
    setTitle(''); setDescription(''); setDueDate(''); setPriority(TaskPriority.MEDIUM);
    navigate('/tasks');
  };

  const inputCls = `w-full border rounded text-sm px-3 py-2 focus:ring-1 focus:ring-primary ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright focus:bg-dark-bg' : 'bg-atlassian-neutral border-atlassian-border focus:bg-white'}`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`;

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Assign Task</h2>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <div className={`border rounded ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
            <div className={`px-6 py-4 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
              <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Assign New Task</h3>
              <p className={`text-xs mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Fill out the details below to delegate a task to a team member.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Assign To <span className="text-red-500">*</span></label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputCls} required>
                    <option value="">Select employee...</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Project <span className="text-red-500">*</span></label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls} required>
                    <option value="">Select project...</option>
                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Task Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details or context (optional)" rows={3} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Due Date <span className="text-red-500">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputCls}>
                    <option value="Low">Low</option><option value="Medium">Medium</option>
                    <option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-6 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>send</span>
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          {[
            { icon: 'bolt', title: 'Quick Allocation', desc: 'Average task assignment takes less than 2 minutes.' },
            { icon: 'balance', title: 'Load Balancing', desc: 'View team capacity before assigning new tickets.' },
            { icon: 'sync', title: 'Instant Sync', desc: 'Status updates reflected everywhere immediately.' },
          ].map(tip => (
            <div key={tip.title} className={`border rounded p-4 flex items-start gap-3 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${dc ? 'bg-dark-bg' : 'bg-blue-50'}`}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{tip.icon}</span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{tip.title}</p>
                <p className={`text-xs mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignTask;
