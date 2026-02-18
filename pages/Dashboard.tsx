import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { TaskStatus } from '../types';

const Dashboard: React.FC = () => {
    const { employees, projects, tasks, blockers } = useData();
    const { dark } = useTheme();
    const todayStr = new Date().toISOString().split('T')[0];
    const dc = dark;

    const stats = useMemo(() => ({
        activeProjects: projects.filter(p => p.status === 'Active').length,
        openTasks: tasks.filter(t => t.status !== TaskStatus.DONE).length,
        dueToday: tasks.filter(t => t.dueDate === todayStr && t.status !== TaskStatus.DONE).length,
        blockedTasks: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
    }), [projects, tasks, todayStr]);

    const overdueTasks = useMemo(() =>
        tasks.filter(t => t.dueDate < todayStr && t.status !== TaskStatus.DONE).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        [tasks, todayStr]);

    const activeBlockers = useMemo(() => blockers.filter(b => b.status === 'Open'), [blockers]);

    const recentTasks = useMemo(() =>
        [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
        [tasks]);

    const getDaysOpen = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Done': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-primary';
            case 'Blocked': return 'bg-red-100 text-red-700';
            default: return dc ? 'bg-dark-bg text-dark-text' : 'bg-gray-200 text-atlassian-text';
        }
    };

    return (
        <div className="space-y-8">
            <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Dashboard</h2>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Projects', value: stats.activeProjects },
                    { label: 'Open Tasks', value: stats.openTasks },
                    { label: 'Due Today', value: stats.dueToday },
                    { label: 'Blocked Tasks', value: stats.blockedTasks },
                ].map(card => (
                    <div key={card.label} className={`border p-5 rounded hover:shadow-sm transition-shadow ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{card.label}</p>
                        <p className="text-3xl font-bold text-primary mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-4 space-y-6">
                    {/* Overdue Tasks */}
                    <div className={`border rounded flex flex-col ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <div className={`px-5 py-3 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : ''}`}>Overdue Tasks</h3>
                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{overdueTasks.length} items</span>
                        </div>
                        {overdueTasks.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-green-600" style={{ fontSize: '28px' }}>task_alt</span>
                                </div>
                                <p className={`text-sm font-medium ${dc ? 'text-dark-text-bright' : ''}`}>No overdue tasks</p>
                                <p className={`text-xs mt-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>You're all caught up!</p>
                            </div>
                        ) : (
                            <ul className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
                                {overdueTasks.map(task => (
                                    <li key={task.id} className={`px-5 py-3 transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'}`}>
                                        <p className={`text-sm font-medium ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-red-600 font-bold">{getDaysOpen(task.dueDate)}d overdue</span>
                                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>• {employees.find(e => e.id === task.assignedToId)?.name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Active Blockers */}
                    <div className={`border rounded flex flex-col ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <div className={`px-5 py-3 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : ''}`}>Active Blockers</h3>
                        </div>
                        {activeBlockers.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>sentiment_satisfied</span>
                                </div>
                                <p className={`text-sm font-medium ${dc ? 'text-dark-text-bright' : ''}`}>No blockers</p>
                                <p className={`text-xs mt-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Workflow is moving smoothly.</p>
                            </div>
                        ) : (
                            <ul className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
                                {activeBlockers.map(b => (
                                    <li key={b.id} className={`px-5 py-3 transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'}`}>
                                        <p className={`text-sm font-medium truncate ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{b.description}</p>
                                        <p className={`text-xs mt-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
                                            {employees.find(e => e.id === b.employeeId)?.name} • {getDaysOpen(b.reportedDate)}d ago
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Recent Tasks Table */}
                <div className="lg:col-span-8">
                    <div className={`border rounded flex flex-col ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <div className={`px-5 py-3 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : ''}`}>Recent Task Assignments</h3>
                            <a href="#/tasks" className="text-xs font-semibold text-primary hover:underline">View all tasks</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${dc ? 'bg-dark-bg border-dark-border' : 'bg-atlassian-neutral border-atlassian-border'}`}>
                                        {['Task Title', 'Project', 'Assigned To', 'Due Date', 'Status'].map(h => (
                                            <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
                                    {recentTasks.map(task => {
                                        const emp = employees.find(e => e.id === task.assignedToId);
                                        const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                                        return (
                                            <tr key={task.id} className={`transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'}`}>
                                                <td className={`px-5 py-4 text-sm font-medium ${dc ? 'text-dark-text-bright' : ''}`}>{task.title}</td>
                                                <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{projects.find(p => p.id === task.projectId)?.name}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-primary">{initials}</div>
                                                        <span className={`text-sm ${dc ? 'text-dark-text-bright' : ''}`}>{emp?.name}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{task.dueDate}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${getStatusBadge(task.status)}`}>{task.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {recentTasks.length === 0 && (
                                        <tr><td colSpan={5} className={`px-5 py-8 text-center text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>No tasks assigned yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
