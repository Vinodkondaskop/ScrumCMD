import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TaskStatus } from '../types';

const Dashboard: React.FC = () => {
    const { employees, projects, tasks, blockers } = useData();
    const todayStr = new Date().toISOString().split('T')[0];

    const stats = useMemo(() => ({
        activeProjects: projects.filter(p => p.status === 'Active').length,
        openTasks: tasks.filter(t => t.status !== TaskStatus.DONE).length,
        dueToday: tasks.filter(t => t.dueDate === todayStr && t.status !== TaskStatus.DONE).length,
        blockedTasks: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
    }), [projects, tasks, todayStr]);

    const overdueTasks = useMemo(() =>
        tasks.filter(t => t.dueDate < todayStr && t.status !== TaskStatus.DONE)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
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
            default: return 'bg-gray-200 text-atlassian-text';
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold text-atlassian-text">Dashboard</h2>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Projects', value: stats.activeProjects },
                    { label: 'Open Tasks', value: stats.openTasks },
                    { label: 'Due Today', value: stats.dueToday },
                    { label: 'Blocked Tasks', value: stats.blockedTasks },
                ].map(card => (
                    <div key={card.label} className="bg-white border border-atlassian-border p-5 rounded hover:shadow-sm transition-shadow">
                        <p className="text-atlassian-subtle text-xs font-bold uppercase tracking-wider">{card.label}</p>
                        <p className="text-3xl font-bold text-primary mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Overdue Tasks */}
                    <div className="bg-white border border-atlassian-border rounded flex flex-col">
                        <div className="px-5 py-3 border-b border-atlassian-border flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Overdue Tasks</h3>
                            <span className="text-xs text-atlassian-subtle">{overdueTasks.length} items</span>
                        </div>
                        {overdueTasks.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-green-600" style={{ fontSize: '28px' }}>task_alt</span>
                                </div>
                                <p className="text-sm font-medium">No overdue tasks</p>
                                <p className="text-xs text-atlassian-subtle mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-atlassian-border">
                                {overdueTasks.map(task => (
                                    <li key={task.id} className="px-5 py-3 hover:bg-atlassian-neutral transition-colors">
                                        <p className="text-sm font-medium text-atlassian-text">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-red-600 font-bold">{getDaysOpen(task.dueDate)}d overdue</span>
                                            <span className="text-xs text-atlassian-subtle">• {employees.find(e => e.id === task.assignedToId)?.name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Active Blockers */}
                    <div className="bg-white border border-atlassian-border rounded flex flex-col">
                        <div className="px-5 py-3 border-b border-atlassian-border">
                            <h3 className="font-semibold text-sm">Active Blockers</h3>
                        </div>
                        {activeBlockers.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>sentiment_satisfied</span>
                                </div>
                                <p className="text-sm font-medium">No blockers</p>
                                <p className="text-xs text-atlassian-subtle mt-1">Workflow is moving smoothly.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-atlassian-border">
                                {activeBlockers.map(b => (
                                    <li key={b.id} className="px-5 py-3 hover:bg-atlassian-neutral transition-colors">
                                        <p className="text-sm font-medium text-atlassian-text truncate">{b.description}</p>
                                        <p className="text-xs text-atlassian-subtle mt-1">
                                            {employees.find(e => e.id === b.employeeId)?.name} • {getDaysOpen(b.reportedDate)}d ago
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-white border border-atlassian-border rounded flex flex-col">
                        <div className="px-5 py-3 border-b border-atlassian-border flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Recent Task Assignments</h3>
                            <a href="#/tasks" className="text-xs font-semibold text-primary hover:underline">View all tasks</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-atlassian-neutral border-b border-atlassian-border">
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Task Title</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Project</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Assigned To</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Due Date</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-atlassian-border">
                                    {recentTasks.map(task => {
                                        const emp = employees.find(e => e.id === task.assignedToId);
                                        const initials = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                                        return (
                                            <tr key={task.id} className="hover:bg-atlassian-neutral transition-colors">
                                                <td className="px-5 py-4 text-sm font-medium">{task.title}</td>
                                                <td className="px-5 py-4 text-sm text-atlassian-subtle">{projects.find(p => p.id === task.projectId)?.name}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-primary">{initials}</div>
                                                        <span className="text-sm">{emp?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-atlassian-subtle">{task.dueDate}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${getStatusBadge(task.status)}`}>{task.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {recentTasks.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-atlassian-subtle">No tasks assigned yet.</td></tr>
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
