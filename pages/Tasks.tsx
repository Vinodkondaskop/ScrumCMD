import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Task, TaskStatus, TaskPriority, EmployeeStatus, ProjectStatus } from '../types';

interface TaskNote { id: string; taskId: string; content: string; createdAt: string; }

const Tasks: React.FC = () => {
  const { tasks, projects, employees, addTask, updateTaskStatus, updateTask, deleteTask } = useData();
  const { dark } = useTheme();
  const { showToast } = useToast();

  const [view, setView] = useState<'table' | 'board'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // Form fields
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [description, setDescription] = useState('');

  // Notes
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Kanban drag
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const resetForm = () => { setTitle(''); setProjectId(''); setAssigneeId(''); setDueDate(''); setPriority(TaskPriority.MEDIUM); setDescription(''); setNotes([]); setNewNote(''); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ projectId, assignedToId: assigneeId, title, description, status: TaskStatus.TODO, priority, dueDate });
    setIsModalOpen(false); resetForm();
  };

  const loadNotes = async (taskId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`);
      setNotes(await res.json());
    } catch { setNotes([]); }
    setLoadingNotes(false);
  };

  const addNote = async () => {
    if (!editingTask || !newNote.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() })
      });
      const note = await res.json();
      setNotes(prev => [note, ...prev]);
      setNewNote('');
      showToast('Note added');
    } catch { showToast('Failed to add note', 'error'); }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.projectId);
    setAssigneeId(task.assignedToId);
    setDueDate(task.dueDate);
    setPriority(task.priority as TaskPriority);
    loadNotes(task.id);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateTask(editingTask.id, { title, description, projectId, assignedToId: assigneeId, dueDate, priority, status: editingTask.status });
    setEditingTask(null); resetForm();
  };

  const handleDelete = (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) deleteTask(task.id);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['Title', 'Project', 'Assigned To', 'Due Date', 'Priority', 'Status'];
    const rows = filteredTasks.map(t => [
      `"${t.title}"`, `"${projects.find(p => p.id === t.projectId)?.name || ''}"`,
      `"${employees.find(e => e.id === t.assignedToId)?.name || ''}"`, t.dueDate, t.priority, t.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
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
      default: return dark ? 'bg-dark-bg text-dark-text' : 'bg-gray-200 text-atlassian-text';
    }
  };

  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE);
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);

  // Kanban columns
  const kanbanCols: { key: TaskStatus; label: string; color: string }[] = [
    { key: TaskStatus.TODO, label: 'Todo', color: 'border-t-gray-400' },
    { key: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'border-t-blue-500' },
    { key: TaskStatus.DONE, label: 'Done', color: 'border-t-green-500' },
    { key: TaskStatus.BLOCKED, label: 'Blocked', color: 'border-t-red-500' },
  ];

  const handleDragStart = (taskId: string) => { dragItem.current = taskId; };
  const handleDragOver = (e: React.DragEvent, col: string) => { e.preventDefault(); setDragOverCol(col); };
  const handleDragLeave = () => setDragOverCol(null);
  const handleDrop = (status: TaskStatus) => {
    if (dragItem.current) {
      updateTaskStatus(dragItem.current, status);
      dragItem.current = null;
    }
    setDragOverCol(null);
  };

  const dc = dark; // shorthand

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Master Task List</h2>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className={`flex rounded border ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
            <button onClick={() => setView('table')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${view === 'table' ? (dc ? 'bg-dark-surface text-dark-text-bright' : 'bg-white text-atlassian-text') : (dc ? 'text-dark-text' : 'text-atlassian-subtle')}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>table_rows</span> Table
            </button>
            <button onClick={() => setView('board')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 border-l ${dc ? 'border-dark-border' : 'border-atlassian-border'} ${view === 'board' ? (dc ? 'bg-dark-surface text-dark-text-bright' : 'bg-white text-atlassian-text') : (dc ? 'text-dark-text' : 'text-atlassian-subtle')}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>view_kanban</span> Board
            </button>
          </div>
          <button onClick={exportCSV}
            className={`py-2 px-3 rounded text-sm font-medium flex items-center gap-1 border ${dc ? 'border-dark-border text-dark-text hover:bg-dark-surface' : 'border-atlassian-border text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> CSV
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
            <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span> Add Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`border rounded p-4 flex flex-wrap items-center gap-4 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
        <span className={`material-symbols-outlined ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`} style={{ fontSize: '18px' }}>filter_list</span>
        <div className="flex items-center gap-2">
          <label className={`text-xs font-medium ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Due Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className={`border rounded text-sm px-3 py-1.5 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'}`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={`border rounded text-sm px-3 py-1.5 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'}`}>
          <option value="all">All Statuses</option>
          <option value="Todo">Todo</option><option value="In Progress">In Progress</option>
          <option value="Done">Done</option><option value="Blocked">Blocked</option>
        </select>
        <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
          className={`border rounded text-sm px-3 py-1.5 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'}`}>
          <option value="all">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {(dateFilter || statusFilter !== 'all' || employeeFilter !== 'all') && (
          <button onClick={() => { setDateFilter(''); setStatusFilter('all'); setEmployeeFilter('all'); }}
            className="text-xs font-semibold text-red-600 hover:underline">Clear</button>
        )}
        <span className={`ml-auto text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className={`border rounded overflow-x-auto ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${dc ? 'bg-dark-bg border-dark-border' : 'bg-atlassian-neutral border-atlassian-border'}`}>
                {['Task', 'Project', 'Assigned To', 'Due Date', 'Priority', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'} ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
              {filteredTasks.map(task => {
                const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                const emp = employees.find(e => e.id === task.assignedToId);
                const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                return (
                  <tr key={task.id} className={`transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'} ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                    <td className={`px-5 py-4 text-sm font-medium ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
                      {task.title}
                      {isOverdue && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm uppercase">Overdue</span>}
                    </td>
                    <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{projects.find(p => p.id === task.projectId)?.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-primary">{initials}</div>
                        <span className={`text-sm ${dc ? 'text-dark-text-bright' : ''}`}>{emp?.name}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-sm ${isOverdue ? 'text-red-600 font-bold' : dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{task.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold uppercase ${task.priority === 'Critical' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{task.priority}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border-none ${getStatusBadge(task.status)}`}>
                        <option value="Todo">Todo</option><option value="In Progress">In Progress</option>
                        <option value="Done">Done</option><option value="Blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(task)} className={`p-1 rounded transition-colors ${dc ? 'hover:bg-dark-bg text-dark-text hover:text-blue-400' : 'hover:bg-blue-50 text-atlassian-subtle hover:text-primary'}`} title="Edit">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(task)} className={`p-1 rounded transition-colors ${dc ? 'hover:bg-dark-bg text-dark-text hover:text-red-400' : 'hover:bg-red-50 text-atlassian-subtle hover:text-red-600'}`} title="Delete">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr><td colSpan={7} className={`px-5 py-8 text-center text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>No tasks match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {view === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanCols.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <div key={col.key}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(col.key)}
                className={`rounded border-t-2 ${col.color} min-h-[300px] ${dc ? 'bg-dark-bg border border-dark-border' : 'bg-atlassian-neutral border border-atlassian-border'} ${dragOverCol === col.key ? (dc ? '!bg-dark-surface' : '!bg-blue-50/50') : ''} transition-colors`}>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{col.label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${dc ? 'bg-dark-surface text-dark-text' : 'bg-white text-atlassian-subtle'}`}>{colTasks.length}</span>
                </div>
                <div className="px-2 pb-2 space-y-2">
                  {colTasks.map(task => {
                    const emp = employees.find(e => e.id === task.assignedToId);
                    const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                    const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                    return (
                      <div key={task.id} draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={`kanban-card rounded p-3 border transition-shadow hover:shadow-md ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <p className={`text-sm font-medium mb-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{task.title}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-primary">{initials}</div>
                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{emp?.name?.split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase ${task.priority === 'Critical' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{task.priority}</span>
                            {isOverdue && <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded-sm uppercase">Late</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed" style={{ borderColor: dc ? '#3a3f44' : '#dfe1e6' }}>
                          <span className={`text-[10px] ${isOverdue ? 'text-red-600 font-bold' : dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{task.dueDate}</span>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(task)} className={`p-0.5 rounded ${dc ? 'hover:bg-dark-bg text-dark-text' : 'hover:bg-atlassian-neutral text-atlassian-subtle'}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                            <button onClick={() => handleDelete(task)} className={`p-0.5 rounded ${dc ? 'hover:bg-dark-bg text-dark-text hover:text-red-400' : 'hover:bg-red-50 text-atlassian-subtle hover:text-red-600'}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className={`rounded-xl w-full max-w-lg border ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`} style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className={`px-6 py-4 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
              <h3 className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Add Task</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Task Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)}
                  className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Description</label>
                <textarea rows={2} placeholder="Optional details" value={description} onChange={e => setDescription(e.target.value)}
                  className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Project <span className="text-red-500">*</span></label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required>
                    <option value="">Select Project</option>
                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Assign To <span className="text-red-500">*</span></label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required>
                    <option value="">Select Employee</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Due Date <span className="text-red-500">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`}>
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-sm rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal with Notes */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className={`rounded-xl w-full max-w-2xl border max-h-[90vh] flex flex-col ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`} style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
              <h3 className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Edit Task</h3>
              <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>ID: {editingTask.id}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleEdit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Task Title <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Description</label>
                  <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Project <span className="text-red-500">*</span></label>
                    <select value={projectId} onChange={e => setProjectId(e.target.value)}
                      className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required>
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Assign To <span className="text-red-500">*</span></label>
                    <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                      className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required>
                      <option value="">Select Employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Due Date <span className="text-red-500">*</span></label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                      className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Notes Section */}
                <div className={`border-t pt-4 mt-4 ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>comment</span>
                    Notes & Comments
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Add a note…" value={newNote} onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNote(); } }}
                      className={`flex-1 border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} />
                    <button type="button" onClick={addNote} disabled={!newNote.trim()}
                      className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-primary-hover disabled:opacity-40">
                      <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>send</span>
                    </button>
                  </div>
                  {loadingNotes ? (
                    <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Loading notes…</p>
                  ) : notes.length === 0 ? (
                    <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>No notes yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {notes.map(note => (
                        <div key={note.id} className={`rounded p-2.5 border text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border text-atlassian-text'}`}>
                          <p>{note.content}</p>
                          <p className={`text-[10px] mt-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{new Date(note.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setEditingTask(null); resetForm(); }} className={`px-4 py-2 text-sm rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                  <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>save</span> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
