import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { EmployeeStatus, ProjectStatus, TaskPriority } from '../types';

// Reusable multi-select chip dropdown
const MultiSelect: React.FC<{
  label: string; required?: boolean; placeholder: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  dark: boolean;
}> = ({ label, required, placeholder, options, selected, onChange, dark: dc }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`;

  return (
    <div ref={ref} className="relative">
      <label className={labelCls}>{label} {required && <span className="text-red-500">*</span>}</label>
      <div
        onClick={() => setOpen(!open)}
        className={`w-full border rounded text-sm px-3 py-2 cursor-pointer min-h-[38px] flex flex-wrap gap-1.5 items-center ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'}`}
      >
        {selected.length === 0 && <span className={`${dc ? 'text-dark-text' : 'text-atlassian-subtle'} text-sm`}>{placeholder}</span>}
        {selected.map(id => {
          const opt = options.find(o => o.id === id);
          return opt ? (
            <span key={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dc ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              {opt.name}
              <button type="button" onClick={e => { e.stopPropagation(); toggle(id); }}
                className={`hover:text-red-500 transition-colors ml-0.5`}>×</button>
            </span>
          ) : null;
        })}
        <span className={`material-symbols-outlined ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`} style={{ fontSize: '18px' }}>expand_more</span>
      </div>
      {open && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 border rounded shadow-lg max-h-48 overflow-y-auto ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          {options.length === 0 && <p className={`px-3 py-2 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>No options</p>}
          {options.map(opt => (
            <button type="button" key={opt.id} onClick={() => toggle(opt.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${selected.includes(opt.id) ? (dc ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700') : (dc ? 'hover:bg-dark-bg text-dark-text-bright' : 'hover:bg-atlassian-neutral text-atlassian-text')}`}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${selected.includes(opt.id) ? 'bg-primary border-primary text-white' : (dc ? 'border-dark-border' : 'border-atlassian-border')}`}>
                {selected.includes(opt.id) && '✓'}
              </span>
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AssignTask: React.FC = () => {
  const { employees, projects, addTask } = useData();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const dc = dark;

  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE);
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);

  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigneeIds.length === 0 || projectIds.length === 0 || !title || !dueDate) return;
    addTask({
      assignedToId: assigneeIds.join(','),
      projectId: projectIds.join(','),
      title,
      description: description || '',
      status: 'Todo' as any,
      priority,
      dueDate,
    });
    setTitle(''); setDescription(''); setDueDate(''); setPriority(TaskPriority.MEDIUM);
    setAssigneeIds([]); setProjectIds([]);
    navigate('/tasks');
  };

  const inputCls = `w-full border rounded text-sm px-3 py-2 focus:ring-1 focus:ring-primary ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright focus:bg-dark-bg' : 'bg-atlassian-neutral border-atlassian-border focus:bg-white'}`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`;

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Assign Task</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8">
          <div className={`border rounded ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
            <div className={`px-6 py-4 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
              <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Assign New Task</h3>
              <p className={`text-xs mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Fill out the details below to delegate a task to team members.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MultiSelect
                  label="Assign To" required placeholder="Select employees..."
                  options={activeEmployees.map(e => ({ id: e.id, name: e.name }))}
                  selected={assigneeIds} onChange={setAssigneeIds} dark={dc}
                />
                <MultiSelect
                  label="Project" required placeholder="Select projects..."
                  options={activeProjects.map(p => ({ id: p.id, name: p.name }))}
                  selected={projectIds} onChange={setProjectIds} dark={dc}
                />
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

        <div className="lg:col-span-4 space-y-4">
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
