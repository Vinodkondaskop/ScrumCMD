import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { TaskStatus, TaskPriority } from '../types';

const Dashboard: React.FC = () => {
    const { employees, projects, tasks, blockers } = useData();

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = useMemo(() => {
        return {
            activeProjects: projects.filter(p => p.status === 'Active').length,
            openTasks: tasks.filter(t => t.status !== TaskStatus.DONE).length,
            dueToday: tasks.filter(t => t.dueDate === todayStr && t.status !== TaskStatus.DONE).length,
            blockedTasks: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
        };
    }, [projects, tasks, todayStr]);

    // Overdue tasks
    const overdueTasks = useMemo(() => {
        return tasks
            .filter(t => t.dueDate < todayStr && t.status !== TaskStatus.DONE)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }, [tasks, todayStr]);

    const activeBlockers = useMemo(() => {
        return blockers.filter(b => b.status === 'Open');
    }, [blockers]);

    // Recent task assignments (latest tasks created)
    const recentTasks = useMemo(() => {
        return [...tasks]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
    }, [tasks]);

    const getDaysOpen = (dateStr: string) => {
        const start = new Date(dateStr).getTime();
        const now = new Date().getTime();
        return Math.floor((now - start) / (1000 * 60 * 60 * 24));
    };

    const getBlockerColor = (days: number) => {
        if (days >= 4) return 'bg-red-100 text-red-800 border-red-200';
        if (days >= 2) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case TaskStatus.DONE: return 'bg-green-100 text-green-800';
            case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case TaskStatus.BLOCKED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-8">
            {/* A. Today's Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 uppercase">Active Projects</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stats.activeProjects}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 uppercase">Open Tasks</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.openTasks}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 uppercase">Due Today</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.dueToday}</p>
                </div>
                <div className={`p-6 rounded-xl shadow-sm border ${stats.blockedTasks > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-medium uppercase ${stats.blockedTasks > 0 ? 'text-red-600' : 'text-slate-500'}`}>Blocked Tasks</h3>
                    <p className={`text-3xl font-bold mt-2 ${stats.blockedTasks > 0 ? 'text-red-700' : 'text-slate-800'}`}>{stats.blockedTasks}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Col: Overdue & Blockers */}
                <div className="space-y-8 xl:col-span-1">
                    {/* Overdue Tasks */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${overdueTasks.length > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <h2 className={`font-semibold flex items-center gap-2 ${overdueTasks.length > 0 ? 'text-red-900' : 'text-slate-800'}`}>
                                🔴 Overdue Tasks
                            </h2>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${overdueTasks.length > 0 ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-600'}`}>{overdueTasks.length}</span>
                        </div>
                        {overdueTasks.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No overdue tasks! 🎉</div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {overdueTasks.map(task => (
                                    <li key={task.id} className="p-4 hover:bg-red-50/50">
                                        <div className="font-medium text-slate-900 text-sm">{task.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-red-600 font-bold">{getDaysOpen(task.dueDate)}d overdue</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">{employees.find(e => e.id === task.assignedToId)?.name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Blockers Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800">🚧 Active Blockers</h2>
                            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">{activeBlockers.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">Issue</th>
                                        <th className="px-4 py-3">Owner</th>
                                        <th className="px-4 py-3 text-right">Age</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeBlockers.map(blocker => {
                                        const days = getDaysOpen(blocker.reportedDate);
                                        return (
                                            <tr key={blocker.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900 truncate max-w-[200px]" title={blocker.description}>{blocker.description}</div>
                                                    <div className="text-xs text-slate-500">Task: {blocker.taskTitle}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {employees.find(e => e.id === blocker.employeeId)?.name}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getBlockerColor(days)}`}>
                                                        {days}d
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {activeBlockers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-400">No active blockers.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Col: Recent Task Assignments */}
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">📋 Recent Task Assignments</h2>
                    <div className="space-y-3">
                        {recentTasks.map(task => {
                            const emp = employees.find(e => e.id === task.assignedToId);
                            const project = projects.find(p => p.id === task.projectId);
                            const isOverdue = task.dueDate < todayStr && task.status !== TaskStatus.DONE;

                            return (
                                <div key={task.id} className={`bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{task.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {project?.name} • Assigned to <span className="font-medium text-slate-700">{emp?.name}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                                Due: {task.dueDate}
                                            </span>
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusBadge(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                    {task.priority === 'Critical' || task.priority === 'High' ? (
                                        <span className={`mt-2 inline-block text-xs font-bold ${task.priority === 'Critical' ? 'text-red-600' : 'text-orange-600'}`}>
                                            ⚡ {task.priority} Priority
                                        </span>
                                    ) : null}
                                </div>
                            );
                        })}
                        {recentTasks.length === 0 && <div className="text-center py-10 text-slate-400">No tasks assigned yet. Use "Assign Task" to get started.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
