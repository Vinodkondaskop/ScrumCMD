import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Task, TaskStatus, TaskPriority, EmployeeStatus, ProjectStatus } from '../types';

const Tasks: React.FC = () => {
  const { tasks, projects, employees, addTask, updateTaskStatus, updateTask } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [description, setDescription] = useState('');

  const resetForm = () => { setTitle(''); setProjectId(''); setAssigneeId(''); setDueDate(''); setPriority(TaskPriority.MEDIUM); setDescription(''); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ projectId, assignedToId: assigneeId, title, description, status: TaskStatus.TODO, priority, dueDate });
    setIsModalOpen(false); resetForm();
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.projectId);
    setAssigneeId(task.assignedToId);
    setDueDate(task.dueDate);
    setPriority(task.priority as TaskPriority);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateTask(editingTask.id, { title, description, projectId, assignedToId: assigneeId, dueDate, priority, status: editingTask.status });
    setEditingTask(null); resetForm();
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (dateFilter) result = result.filter(t => t.dueDate === dateFilter);
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (employeeFilter !== 'all') result = result.filter(t => t.assignedToId === employeeFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, dateFilter, statusFilter, employeeFilter]);

  const todayStr = new Date().toISOString().split('T')[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-primary';
      case 'Blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-200 text-atlassian-text';
    }
  };

  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE);
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-atlassian-text">Master Task List</h2>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
          Add Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-atlassian-border rounded p-4 flex flex-wrap items-center gap-4">
        <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '18px' }}>filter_list</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-atlassian-subtle font-medium">Due Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-1.5" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-1.5">
          <option value="all">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Blocked">Blocked</option>
        </select>
        <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
          className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-1.5">
          <option value="all">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {(dateFilter || statusFilter !== 'all' || employeeFilter !== 'all') && (
          <button onClick={() => { setDateFilter(''); setStatusFilter('all'); setEmployeeFilter('all'); }}
            className="text-xs font-semibold text-red-600 hover:underline">Clear</button>
        )}
        <span className="ml-auto text-xs text-atlassian-subtle">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-atlassian-border rounded overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-atlassian-neutral border-b border-atlassian-border">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Task</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Project</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Assigned To</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Due Date</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Priority</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Status</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-atlassian-border">
            {filteredTasks.map(task => {
              const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
              const emp = employees.find(e => e.id === task.assignedToId);
              const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
              return (
                <tr key={task.id} className={`hover:bg-atlassian-neutral transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
                  <td className="px-5 py-4 text-sm font-medium text-atlassian-text">
                    {task.title}
                    {isOverdue && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm uppercase">Overdue</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-atlassian-subtle">{projects.find(p => p.id === task.projectId)?.name}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-primary">{initials}</div>
                      <span className="text-sm">{emp?.name}</span>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-atlassian-subtle'}`}>{task.dueDate}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase ${task.priority === 'Critical' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : 'text-atlassian-subtle'}`}>{task.priority}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border-none ${getStatusBadge(task.status)}`}>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => openEdit(task)} className="p-1 hover:bg-blue-50 rounded text-atlassian-subtle hover:text-primary transition-colors" title="Edit task">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-atlassian-subtle">No tasks match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg border border-atlassian-border" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className="px-6 py-4 border-b border-atlassian-border">
              <h3 className="font-semibold text-atlassian-text">Add Task</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={2} placeholder="Optional details" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Project <span className="text-red-500">*</span></label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required>
                    <option value="">Select Project</option>
                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Assign To <span className="text-red-500">*</span></label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required>
                    <option value="">Select Employee</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2">
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-atlassian-subtle hover:bg-atlassian-neutral rounded">Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg border border-atlassian-border" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className="px-6 py-4 border-b border-atlassian-border flex items-center justify-between">
              <h3 className="font-semibold text-atlassian-text">Edit Task</h3>
              <span className="text-xs text-atlassian-subtle">ID: {editingTask.id}</span>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Project <span className="text-red-500">*</span></label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Assign To <span className="text-red-500">*</span></label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required>
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2">
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setEditingTask(null); resetForm(); }} className="px-4 py-2 text-sm text-atlassian-subtle hover:bg-atlassian-neutral rounded">Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
