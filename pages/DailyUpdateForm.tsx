import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { EmployeeStatus, ProjectStatus, TaskPriority } from '../types';

const AssignTask: React.FC = () => {
  const { employees, projects, addTask } = useData();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-atlassian-text">Assign Task</h2>

      <div className="grid grid-cols-12 gap-8">
        {/* Form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-atlassian-border rounded">
            <div className="px-6 py-4 border-b border-atlassian-border">
              <h3 className="font-semibold text-sm text-atlassian-text">Assign New Task</h3>
              <p className="text-xs text-atlassian-subtle mt-0.5">Fill out the details below to delegate a task to a team member.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Assign To <span className="text-red-500">*</span></label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required>
                    <option value="">Select employee...</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Project <span className="text-red-500">*</span></label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required>
                    <option value="">Select project...</option>
                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?"
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details or context (optional)" rows={3}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
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

        {/* Side Info */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {[
            { icon: 'bolt', title: 'Quick Allocation', desc: 'Average task assignment takes less than 2 minutes.' },
            { icon: 'balance', title: 'Load Balancing', desc: 'View team capacity before assigning new tickets.' },
            { icon: 'sync', title: 'Instant Sync', desc: 'Status updates reflected everywhere immediately.' },
          ].map(tip => (
            <div key={tip.title} className="bg-white border border-atlassian-border rounded p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{tip.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-atlassian-text">{tip.title}</p>
                <p className="text-xs text-atlassian-subtle mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignTask;
