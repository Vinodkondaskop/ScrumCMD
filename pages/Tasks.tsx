import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TaskStatus, TaskPriority, EmployeeStatus, ProjectStatus } from '../types';

const Tasks: React.FC = () => {
  const { tasks, projects, employees, addTask, updateTaskStatus } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // New Task Form State
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      projectId,
      assignedToId: assigneeId,
      title,
      description: 'Added via Task Manager',
      status: TaskStatus.TODO,
      priority,
      dueDate,
    });
    setIsModalOpen(false);
    setTitle('');
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (dateFilter) {
      result = result.filter(t => t.dueDate === dateFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (employeeFilter !== 'all') {
      result = result.filter(t => t.assignedToId === employeeFilter);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, dateFilter, statusFilter, employeeFilter]);

  const todayStr = new Date().toISOString().split('T')[0];

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case TaskStatus.BLOCKED: return 'bg-red-100 text-red-800 animate-pulse';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Master Task List</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
        >
          <span>+</span> Add Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-600">🔍 Filter:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Due Date</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {(dateFilter || statusFilter !== 'all' || employeeFilter !== 'all') && (
            <button onClick={() => { setDateFilter(''); setStatusFilter('all'); setEmployeeFilter('all'); }}
              className="text-xs text-red-500 hover:underline">Clear Filters</button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Task</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map(task => {
              const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
              return (
                <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {task.title}
                    {isOverdue && <span className="ml-2 text-xs text-red-600 font-bold">OVERDUE</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{projects.find(p => p.id === task.projectId)?.name}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                      <img src={employees.find(e => e.id === task.assignedToId)?.avatarUrl} alt="" />
                    </div>
                    <span>{employees.find(e => e.id === task.assignedToId)?.name}</span>
                  </td>
                  <td className={`px-6 py-4 font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{task.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${task.priority === 'Critical' ? 'text-red-600' : 'text-slate-600'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`px-2 py-1 rounded-md text-xs font-bold border-none focus:ring-1 focus:ring-blue-500 ${getStatusBadge(task.status)}`}
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No tasks match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Task</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Task Title" className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project <span className="text-red-500">*</span></label>
                  <select className="w-full border p-2 rounded" value={projectId} onChange={e => setProjectId(e.target.value)} required>
                    <option value="">Select Project</option>
                    {projects.filter(p => p.status === ProjectStatus.ACTIVE).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign To <span className="text-red-500">*</span></label>
                  <select className="w-full border p-2 rounded" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                    <option value="">Assign To</option>
                    {employees.filter(e => e.status === EmployeeStatus.ACTIVE).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full border p-2 rounded" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select className="w-full border p-2 rounded" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
