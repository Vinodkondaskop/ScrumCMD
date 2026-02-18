import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TaskStatus } from '../types';

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { employees, tasks, projects, updateTaskStatus } = useData();
    const employee = employees.find(e => e.id === id);

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    if (!employee) return (
        <div className="p-12 text-center">
            <p className="text-sm text-atlassian-subtle">Employee not found.</p>
            <button onClick={() => navigate('/employees')} className="text-primary text-sm font-semibold mt-2 hover:underline">← Back to roster</button>
        </div>
    );

    const empTasks = useMemo(() => {
        let result = tasks.filter(t => t.assignedToId === id);
        if (dateFrom) result = result.filter(t => t.dueDate >= dateFrom);
        if (dateTo) result = result.filter(t => t.dueDate <= dateTo);
        if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
        return result.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    }, [tasks, id, dateFrom, dateTo, statusFilter]);

    const todayStr = new Date().toISOString().split('T')[0];
    const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const allEmpTasks = tasks.filter(t => t.assignedToId === id);
    const stats = {
        total: allEmpTasks.length,
        done: allEmpTasks.filter(t => t.status === TaskStatus.DONE).length,
        inProgress: allEmpTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        overdue: allEmpTasks.filter(t => t.dueDate < todayStr && t.status !== TaskStatus.DONE).length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Done': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-primary';
            case 'Blocked': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-200 text-atlassian-text';
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/employees')} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                Back to Team Roster
            </button>

            {/* Header Card */}
            <div className="bg-white border border-atlassian-border rounded p-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-primary">{initials}</div>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-atlassian-text">{employee.name}</h2>
                    <p className="text-sm text-atlassian-subtle">{employee.role} • {employee.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-atlassian-subtle'}`}>
                    {employee.status}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tasks', value: stats.total, color: 'text-primary' },
                    { label: 'Completed', value: stats.done, color: 'text-green-600' },
                    { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
                    { label: 'Overdue', value: stats.overdue, color: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-atlassian-border p-4 rounded">
                        <p className="text-atlassian-subtle text-xs font-bold uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter + Task List */}
            <div className="bg-white border border-atlassian-border rounded">
                <div className="px-5 py-3 border-b border-atlassian-border flex flex-wrap items-center gap-4">
                    <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '18px' }}>filter_list</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-atlassian-subtle font-medium">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-2 py-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-atlassian-subtle font-medium">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-2 py-1" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-1.5">
                        <option value="all">All Statuses</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                    <span className="ml-auto text-xs text-atlassian-subtle">{empTasks.length} result{empTasks.length !== 1 ? 's' : ''}</span>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-atlassian-neutral border-b border-atlassian-border">
                            <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Task</th>
                            <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Project</th>
                            <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Due Date</th>
                            <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Priority</th>
                            <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-atlassian-border">
                        {empTasks.map(task => {
                            const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                            return (
                                <tr key={task.id} className={`hover:bg-atlassian-neutral transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
                                    <td className="px-5 py-4 text-sm font-medium text-atlassian-text">
                                        {task.title}
                                        {isOverdue && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm uppercase">Overdue</span>}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-atlassian-subtle">{projects.find(p => p.id === task.projectId)?.name}</td>
                                    <td className={`px-5 py-4 text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-atlassian-subtle'}`}>{task.dueDate}</td>
                                    <td className="px-5 py-4">
                                        <span className={`text-[10px] font-bold uppercase ${task.priority === 'Critical' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : 'text-atlassian-subtle'}`}>{task.priority}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border-none ${getStatusBadge(task.status)}`}>
                                            <option value="Todo">Todo</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                            <option value="Blocked">Blocked</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                        {empTasks.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-atlassian-subtle">No tasks match the current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeProfile;
