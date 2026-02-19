import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Task, TaskStatus, TaskPriority, EmployeeStatus, ProjectStatus } from '../types';

interface TaskNote { id: string; taskId: string; content: string; createdAt: string; }

// ─── Reusable Multi-Select Chip Dropdown ──────────────────────────────────
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
                className="hover:text-red-500 transition-colors ml-0.5">×</button>
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

// ─── Helper: parse comma-separated IDs ───────────────────────────────────
const parseIds = (csv: string): string[] => csv ? csv.split(',').filter(Boolean) : [];

// ─── Chip display for multiple names ──────────────────────────────────────
const NameChips: React.FC<{ ids: string[]; items: { id: string; name: string }[]; dark: boolean }> = ({ ids, items, dark: dc }) => (
  <div className="flex flex-wrap gap-1">
    {ids.map(id => {
      const item = items.find(i => i.id === id);
      return item ? (
        <span key={id} className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${dc ? 'bg-dark-bg text-dark-text-bright border border-dark-border' : 'bg-gray-100 text-atlassian-text border border-atlassian-border'}`}>
          {item.name}
        </span>
      ) : null;
    })}
  </div>
);

// ─── Avatar stack for multiple employees ─────────────────────────────────
const AvatarStack: React.FC<{ ids: string[]; employees: { id: string; name: string }[]; dark: boolean }> = ({ ids, employees, dark: dc }) => (
  <div className="flex items-center">
    <div className="flex -space-x-1.5">
      {ids.slice(0, 3).map(id => {
        const emp = employees.find(e => e.id === id);
        const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
        return (
          <div key={id} className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-white dark:border-dark-surface" title={emp?.name}>
            {initials}
          </div>
        );
      })}
      {ids.length > 3 && <span className={`text-[10px] font-bold ml-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>+{ids.length - 3}</span>}
    </div>
    <span className={`text-sm ml-2 ${dc ? 'text-dark-text-bright' : ''}`}>
      {ids.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join(', ')}
    </span>
  </div>
);

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Form fields — now arrays for multi-select
  const [title, setTitle] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
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

  const resetForm = () => { setTitle(''); setProjectIds([]); setAssigneeIds([]); setDueDate(''); setPriority(TaskPriority.MEDIUM); setDescription(''); setNotes([]); setNewNote(''); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ projectId: projectIds.join(','), assignedToId: assigneeIds.join(','), title, description, status: TaskStatus.TODO, priority, dueDate });
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
    setProjectIds(parseIds(task.projectId));
    setAssigneeIds(parseIds(task.assignedToId));
    setDueDate(task.dueDate);
    setPriority(task.priority as TaskPriority);
    loadNotes(task.id);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateTask(editingTask.id, { title, description, projectId: projectIds.join(','), assignedToId: assigneeIds.join(','), dueDate, priority, status: editingTask.status });
    setEditingTask(null); resetForm();
  };

  const handleDelete = (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) deleteTask(task.id);
  };

  // CSV Export — show all names joined
  const exportCSV = () => {
    const headers = ['Title', 'Project', 'Assigned To', 'Due Date', 'Priority', 'Status'];
    const rows = filteredTasks.map(t => [
      `"${t.title}"`,
      `"${parseIds(t.projectId).map(pid => projects.find(p => p.id === pid)?.name || '').join('; ')}"`,
      `"${parseIds(t.assignedToId).map(eid => employees.find(e => e.id === eid)?.name || '').join('; ')}"`,
      t.dueDate, t.priority, t.status
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
    if (employeeFilter !== 'all') result = result.filter(t => parseIds(t.assignedToId).includes(employeeFilter));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, dateFilter, statusFilter, employeeFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, employeeFilter]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredTasks, currentPage]);

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
                {['Task', 'Project(s)', 'Assigned To', 'Due Date', 'Priority', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'} ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
              {paginatedTasks.map(task => {
                const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                const empIds = parseIds(task.assignedToId);
                const projIds = parseIds(task.projectId);
                return (
                  <tr key={task.id} className={`transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'} ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                    <td className={`px-5 py-4 text-sm font-medium ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
                      {task.title}
                      {isOverdue && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm uppercase">Overdue</span>}
                    </td>
                    <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
                      <NameChips ids={projIds} items={projects} dark={dc} />
                    </td>
                    <td className="px-5 py-4">
                      <AvatarStack ids={empIds} employees={employees} dark={dc} />
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
            const colTasks = paginatedTasks.filter(t => t.status === col.key);
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
                    const empIds = parseIds(task.assignedToId);
                    const firstEmp = employees.find(e => e.id === empIds[0]);
                    const initials = firstEmp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                    const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                    return (
                      <div key={task.id} draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={`kanban-card rounded p-3 border transition-shadow hover:shadow-md ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <p className={`text-sm font-medium mb-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{task.title}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1">
                              {empIds.slice(0, 2).map(id => {
                                const emp = employees.find(e => e.id === id);
                                const ini = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                                return (
                                  <div key={id} className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-primary border border-white dark:border-dark-surface" title={emp?.name}>{ini}</div>
                                );
                              })}
                            </div>
                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
                              {firstEmp?.name?.split(' ')[0]}{empIds.length > 1 ? ` +${empIds.length - 1}` : ''}
                            </span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright hover:bg-dark-surface disabled:opacity-30' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright hover:bg-dark-surface disabled:opacity-30' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
                Showing <span className="font-medium">{(currentPage - 1) * tasksPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * tasksPerPage, filteredTasks.length)}</span> of{' '}
                <span className="font-medium">{filteredTasks.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 ${dc ? 'bg-dark-bg ring-dark-border hover:bg-dark-surface' : ''}`}
                >
                  <span className="sr-only">Previous</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${currentPage === i + 1
                      ? 'z-10 bg-primary text-white focus-visible:outline-primary'
                      : `text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 ${dc ? 'bg-dark-bg text-dark-text-bright ring-dark-border hover:bg-dark-surface' : ''}`
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 ${dc ? 'bg-dark-bg ring-dark-border hover:bg-dark-surface' : ''}`}
                >
                  <span className="sr-only">Next</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
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
                <MultiSelect label="Project" required placeholder="Select project(s)..."
                  options={activeProjects.map(p => ({ id: p.id, name: p.name }))}
                  selected={projectIds} onChange={setProjectIds} dark={dc} />
                <MultiSelect label="Assign To" required placeholder="Select employee(s)..."
                  options={activeEmployees.map(e => ({ id: e.id, name: e.name }))}
                  selected={assigneeIds} onChange={setAssigneeIds} dark={dc} />
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
                  <MultiSelect label="Project" required placeholder="Select project(s)..."
                    options={projects.map(p => ({ id: p.id, name: p.name }))}
                    selected={projectIds} onChange={setProjectIds} dark={dc} />
                  <MultiSelect label="Assign To" required placeholder="Select employee(s)..."
                    options={employees.map(e => ({ id: e.id, name: e.name }))}
                    selected={assigneeIds} onChange={setAssigneeIds} dark={dc} />
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
