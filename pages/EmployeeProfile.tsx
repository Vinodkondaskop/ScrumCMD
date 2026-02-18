import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TaskStatus } from '../types';

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { employees, tasks, projects, updateTaskStatus } = useData();

    const employee = employees.find(e => e.id === id);

    // Date filter state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // All tasks for this employee
    const employeeTasks = useMemo(() => {
        let filtered = tasks.filter(t => t.assignedToId === id);

        if (dateFrom) {
            filtered = filtered.filter(t => t.dueDate >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(t => t.dueDate <= dateTo);
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [tasks, id, dateFrom, dateTo, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const all = tasks.filter(t => t.assignedToId === id);
        const todayStr = new Date().toISOString().split('T')[0];
        return {
            total: all.length,
            todo: all.filter(t => t.status === TaskStatus.TODO).length,
            inProgress: all.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
            done: all.filter(t => t.status === TaskStatus.DONE).length,
            blocked: all.filter(t => t.status === TaskStatus.BLOCKED).length,
            overdue: all.filter(t => t.dueDate < todayStr && t.status !== TaskStatus.DONE).length,
        };
    }, [tasks, id]);

    // Weekly summary: tasks grouped by the week they were created
    const weeklySummary = useMemo(() => {
        const all = tasks.filter(t => t.assignedToId === id);
        const weeks: Record<string, typeof all> = {};

        all.forEach(task => {
            const date = new Date(task.createdAt);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Sunday
            const key = weekStart.toISOString().split('T')[0];
            if (!weeks[key]) weeks[key] = [];
            weeks[key].push(task);
        });

        return Object.entries(weeks)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 4); // Last 4 weeks
    }, [tasks, id]);

    if (!employee) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">Employee not found.</p>
                <button onClick={() => navigate('/employees')} className="mt-4 text-blue-600 hover:underline">← Back to Team Roster</button>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case TaskStatus.DONE: return 'bg-green-100 text-green-800';
            case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case TaskStatus.BLOCKED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button onClick={() => navigate('/employees')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
                ← Back to Team Roster
            </button>

            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
                <img src={employee.avatarUrl} alt="" className="w-16 h-16 rounded-full bg-slate-200 object-cover" />
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
                    <p className="text-slate-500">{employee.role} • {employee.email}</p>
                    <p className="text-xs text-slate-400 mt-1">Joined: {employee.joinedDate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {employee.status}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">Total</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-slate-500">{stats.todo}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">Todo</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">In Progress</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">Done</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">Blocked</p>
                </div>
                <div className={`p-4 rounded-lg border text-center ${stats.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-700' : 'text-slate-800'}`}>{stats.overdue}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">Overdue</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">Filter:</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
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
                    {(dateFrom || dateTo || statusFilter !== 'all') && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('all'); }}
                            className="text-xs text-red-500 hover:underline">Clear Filters</button>
                    )}
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-800">Assigned Tasks ({employeeTasks.length})</h2>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-3">Task</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Due Date</th>
                            <th className="px-6 py-3">Priority</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employeeTasks.map(task => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                            return (
                                <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{task.title}</span>
                                        {isOverdue && <span className="ml-2 text-xs text-red-600 font-bold">OVERDUE</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{projects.find(p => p.id === task.projectId)?.name || '—'}</td>
                                    <td className={`px-6 py-4 font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{task.dueDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold ${task.priority === 'Critical' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : 'text-slate-600'}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={task.status}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                            className={`text-xs font-bold border-none bg-transparent rounded p-1 focus:ring-1 focus:ring-blue-500 ${getStatusBadge(task.status).split(' ')[1]}`}
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
                        {employeeTasks.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No tasks found for the selected filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-800">📅 Weekly Summary</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {weeklySummary.length === 0 && (
                        <div className="p-8 text-center text-slate-400">No task history yet.</div>
                    )}
                    {weeklySummary.map(([weekStart, weekTasks]) => {
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        const done = weekTasks.filter(t => t.status === TaskStatus.DONE).length;
                        const total = weekTasks.length;

                        return (
                            <div key={weekStart} className="p-4 hover:bg-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">
                                        Week of {weekStart} → {weekEnd.toISOString().split('T')[0]}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">{done}/{total} completed</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {weekTasks.map(t => (
                                        <span key={t.id} className={`text-xs px-2 py-1 rounded-md font-medium ${getStatusBadge(t.status)}`}>
                                            {t.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
