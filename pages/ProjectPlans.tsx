import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { PlanItem, ProjectPlan } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

const STATUS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    'Not Started': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', bar: '#94a3b8' },
    'In Progress': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', bar: '#3b82f6' },
    'Done': { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', bar: '#22c55e' },
    'Blocked': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', bar: '#ef4444' },
};

const DEFAULT_ITEMS: PlanItem[] = [
    { id: uid(), phase: 'Discovery', task: 'Requirements gathering & stakeholder interviews', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Discovery', task: 'Market research & competitive analysis', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Design', task: 'Architecture & tech stack decisions', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Design', task: 'UI/UX wireframes & mockups', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Development', task: 'Sprint 1 — Core features', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Development', task: 'Sprint 2 — Secondary features', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Development', task: 'Sprint 3 — Integrations & polish', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Testing', task: 'QA & bug fixes', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Testing', task: 'UAT & stakeholder sign-off', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Launch', task: 'Production deployment & monitoring', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
    { id: uid(), phase: 'Launch', task: 'Documentation & handoff', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 },
];

/* ─── Gantt Chart Component ────────────────────────────────── */
const GanttChart: React.FC<{ items: PlanItem[]; dark: boolean }> = ({ items, dark: dc }) => {
    const datedItems = items.filter(i => i.startDate && i.endDate);
    if (datedItems.length === 0) {
        return (
            <div className={`border rounded-lg p-8 text-center ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                <span className="material-symbols-outlined text-atlassian-subtle mb-2" style={{ fontSize: '36px' }}>timeline</span>
                <p className={`text-sm font-medium ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Add start & end dates to see the Gantt chart</p>
                <p className={`text-xs mt-1 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Fill in dates in the table view above</p>
            </div>
        );
    }

    const allDates = datedItems.flatMap(i => [new Date(i.startDate), new Date(i.endDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    // Add 2-day padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

    // Generate month labels
    const months: { label: string; left: number; width: number }[] = [];
    const tempDate = new Date(minDate);
    tempDate.setDate(1);
    while (tempDate <= maxDate) {
        const monthStart = Math.max(0, (tempDate.getTime() - minDate.getTime()) / 86400000);
        const nextMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1);
        const monthEnd = Math.min(totalDays, (nextMonth.getTime() - minDate.getTime()) / 86400000);
        months.push({
            label: tempDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            left: (monthStart / totalDays) * 100,
            width: ((monthEnd - monthStart) / totalDays) * 100,
        });
        tempDate.setMonth(tempDate.getMonth() + 1);
    }

    // Today marker
    const today = new Date();
    const todayOffset = (today.getTime() - minDate.getTime()) / 86400000;
    const todayPercent = (todayOffset / totalDays) * 100;
    const showToday = todayPercent >= 0 && todayPercent <= 100;

    return (
        <div className={`border rounded-lg overflow-hidden ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
            {/* Month headers */}
            <div className={`relative h-8 border-b ${dc ? 'bg-dark-bg border-dark-border' : 'bg-gray-50 border-atlassian-border'}`}>
                {months.map((m, i) => (
                    <div key={i} className={`absolute top-0 h-full flex items-center px-2 text-[10px] font-bold uppercase tracking-wider border-r ${dc ? 'border-dark-border text-dark-text' : 'border-gray-200 text-atlassian-subtle'}`}
                        style={{ left: `${m.left}%`, width: `${m.width}%` }}>{m.label}</div>
                ))}
            </div>
            {/* Bars */}
            <div className="relative">
                {showToday && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: `${todayPercent}%` }}>
                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-400 text-white text-[8px] font-bold px-1 rounded-b">TODAY</div>
                    </div>
                )}
                {datedItems.map(item => {
                    const start = (new Date(item.startDate).getTime() - minDate.getTime()) / 86400000;
                    const end = (new Date(item.endDate).getTime() - minDate.getTime()) / 86400000;
                    const leftPct = (start / totalDays) * 100;
                    const widthPct = Math.max(1, ((end - start) / totalDays) * 100);
                    const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Not Started'];
                    return (
                        <div key={item.id} className={`flex items-center h-10 border-b ${dc ? 'border-dark-border' : 'border-gray-100'}`}>
                            <div className="relative w-full h-full flex items-center">
                                {/* Bar */}
                                <div className="absolute h-6 rounded-md flex items-center overflow-hidden transition-all"
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: sc.bar + '25' }}>
                                    {/* Progress fill */}
                                    <div className="absolute left-0 top-0 bottom-0 rounded-md transition-all" style={{ width: `${item.progress}%`, backgroundColor: sc.bar + '60' }} />
                                    <span className="relative z-10 text-[10px] font-semibold px-2 truncate" style={{ color: sc.bar }}>
                                        {item.task} ({item.progress}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const ProjectPlansPage: React.FC = () => {
    const { projectPlans, projects, employees, addProjectPlan, updateProjectPlan, deleteProjectPlan } = useData();
    const { dark } = useTheme();
    const dc = dark;

    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newProjectId, setNewProjectId] = useState('');
    const [view, setView] = useState<'table' | 'gantt'>('table');

    const selectedPlan = projectPlans.find(p => p.id === selectedPlanId);
    const items: PlanItem[] = useMemo(() => {
        if (!selectedPlan) return [];
        try { return JSON.parse(selectedPlan.items); } catch { return []; }
    }, [selectedPlan]);

    const activeProjects = projects.filter(p => p.status === 'Active');

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        await addProjectPlan({ title: newTitle, projectId: newProjectId, items: JSON.stringify(DEFAULT_ITEMS.map(i => ({ ...i, id: uid() }))) });
        setShowCreate(false); setNewTitle(''); setNewProjectId('');
    };

    const updateItems = (newItems: PlanItem[]) => {
        if (!selectedPlanId) return;
        updateProjectPlan(selectedPlanId, { items: JSON.stringify(newItems) });
    };

    const updateItem = (id: string, field: keyof PlanItem, value: string | number) => {
        updateItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const addRow = () => {
        const newItem: PlanItem = { id: uid(), phase: '', task: '', startDate: '', endDate: '', owner: '', status: 'Not Started', progress: 0 };
        updateItems([...items, newItem]);
    };

    const deleteRow = (id: string) => {
        updateItems(items.filter(i => i.id !== id));
    };

    // Group by phase for visual grouping
    const phases = useMemo(() => {
        const map = new Map<string, PlanItem[]>();
        items.forEach(i => {
            const phase = i.phase || 'Uncategorized';
            if (!map.has(phase)) map.set(phase, []);
            map.get(phase)!.push(i);
        });
        return map;
    }, [items]);

    // Overall progress
    const overallProgress = items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length) : 0;
    const doneCount = items.filter(i => i.status === 'Done').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Project Plans</h2>
                    <p className={`text-sm mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{projectPlans.length} plan{projectPlans.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition-colors text-sm">
                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
                    New Plan
                </button>
            </div>

            {/* Plan selector + detail */}
            {!selectedPlan ? (
                <>
                    {/* Empty or list */}
                    {projectPlans.length === 0 && (
                        <div className={`border rounded-xl p-12 flex flex-col items-center justify-center gap-3 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                            <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '48px' }}>timeline</span>
                            <p className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>No project plans yet</p>
                            <p className={`text-sm text-center max-w-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Create a plan with predefined phases, milestones, and a Gantt chart</p>
                            <button onClick={() => setShowCreate(true)} className="mt-2 bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary-hover transition-colors">
                                Create Project Plan
                            </button>
                        </div>
                    )}

                    {projectPlans.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projectPlans.map(plan => {
                                const proj = projects.find(p => p.id === plan.projectId);
                                let planItems: PlanItem[] = [];
                                try { planItems = JSON.parse(plan.items); } catch { }
                                const progress = planItems.length > 0 ? Math.round(planItems.reduce((s, i) => s + i.progress, 0) / planItems.length) : 0;
                                const done = planItems.filter(i => i.status === 'Done').length;
                                return (
                                    <div key={plan.id} className={`border rounded-lg p-5 hover:shadow-md transition-all cursor-pointer group relative ${dc ? 'bg-dark-surface border-dark-border hover:border-primary/40' : 'bg-white border-atlassian-border hover:border-primary/40'}`}
                                        onClick={() => setSelectedPlanId(plan.id)}>
                                        <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${plan.title}"?`)) deleteProjectPlan(plan.id); }}
                                            className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${dc ? 'text-dark-text hover:bg-dark-bg hover:text-red-400' : 'text-atlassian-subtle hover:bg-red-50 hover:text-red-600'}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                        </button>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>assignment</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold text-sm truncate ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{plan.title}</h3>
                                                {proj && <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{proj.name}</p>}
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className={`h-2 rounded-full w-full mb-2 ${dc ? 'bg-dark-bg' : 'bg-gray-100'}`}>
                                            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{progress}% complete</span>
                                            <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{done}/{planItems.length} tasks</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                /* ─── Plan Detail View ────────────────────────────── */
                <div className="space-y-4">
                    {/* Breadcrumb + controls */}
                    <div className="flex items-center flex-wrap gap-3">
                        <button onClick={() => setSelectedPlanId(null)} className={`flex items-center gap-1 text-sm font-medium ${dc ? 'text-dark-text hover:text-dark-text-bright' : 'text-atlassian-subtle hover:text-atlassian-text'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span> All Plans
                        </button>
                        <span className={`text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>/</span>
                        <h3 className={`text-sm font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{selectedPlan.title}</h3>
                        <div className="ml-auto flex items-center gap-2">
                            {/* View toggle */}
                            <div className={`flex rounded-lg border p-0.5 ${dc ? 'border-dark-border bg-dark-bg' : 'border-atlassian-border bg-gray-50'}`}>
                                {(['table', 'gantt'] as const).map(v => (
                                    <button key={v} onClick={() => setView(v)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === v
                                            ? 'bg-primary text-white'
                                            : dc ? 'text-dark-text hover:text-dark-text-bright' : 'text-atlassian-subtle hover:text-atlassian-text'
                                            }`}>
                                        <span className="material-symbols-outlined mr-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>{v === 'table' ? 'table_chart' : 'timeline'}</span>
                                        {v === 'table' ? 'Table' : 'Gantt'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary bar */}
                    <div className={`border rounded-lg p-4 flex flex-wrap items-center gap-6 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Progress</span>
                            <div className="flex items-center gap-3 mt-1">
                                <div className={`w-32 h-2.5 rounded-full ${dc ? 'bg-dark-bg' : 'bg-gray-100'}`}>
                                    <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style={{ width: `${overallProgress}%` }} />
                                </div>
                                <span className={`text-sm font-bold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{overallProgress}%</span>
                            </div>
                        </div>
                        {Object.entries(STATUS_COLORS).map(([status, sc]) => {
                            const count = items.filter(i => i.status === status).length;
                            return (
                                <div key={status}>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{status}</span>
                                    <p className={`text-lg font-bold mt-0.5 ${sc.text}`}>{count}</p>
                                </div>
                            );
                        })}
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Total</span>
                            <p className={`text-lg font-bold mt-0.5 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{items.length}</p>
                        </div>
                    </div>

                    {/* View: Table */}
                    {view === 'table' && (
                        <div className={`border rounded-lg overflow-hidden ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className={dc ? 'bg-dark-bg' : 'bg-gray-50'}>
                                            {['Phase', 'Task', 'Start', 'End', 'Owner', 'Status', 'Progress', ''].map(h => (
                                                <th key={h} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider ${dc ? 'text-dark-text border-dark-border' : 'text-atlassian-subtle border-atlassian-border'} border-b`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => {
                                            const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Not Started'];
                                            const showPhaseLabel = idx === 0 || items[idx - 1]?.phase !== item.phase;
                                            return (
                                                <tr key={item.id} className={`group ${dc ? 'hover:bg-dark-bg/50 border-dark-border' : 'hover:bg-gray-50 border-atlassian-border'} border-b last:border-b-0 transition-colors`}>
                                                    <td className={`px-3 py-2 text-xs font-medium w-28 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
                                                        {showPhaseLabel ? (
                                                            <input value={item.phase} onChange={e => updateItem(item.id, 'phase', e.target.value)} placeholder="Phase"
                                                                className={`w-full bg-transparent border-0 outline-none text-xs font-semibold p-0 ${dc ? 'text-primary' : 'text-primary'}`} />
                                                        ) : (
                                                            <input value={item.phase} onChange={e => updateItem(item.id, 'phase', e.target.value)}
                                                                className={`w-full bg-transparent border-0 outline-none text-xs p-0 opacity-40 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`} />
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input value={item.task} onChange={e => updateItem(item.id, 'task', e.target.value)} placeholder="Task description"
                                                            className={`w-full bg-transparent border-0 outline-none text-xs p-0 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`} />
                                                    </td>
                                                    <td className="px-3 py-2 w-28">
                                                        <input type="date" value={item.startDate} onChange={e => updateItem(item.id, 'startDate', e.target.value)}
                                                            className={`bg-transparent border-0 outline-none text-xs p-0 w-full ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`} />
                                                    </td>
                                                    <td className="px-3 py-2 w-28">
                                                        <input type="date" value={item.endDate} onChange={e => updateItem(item.id, 'endDate', e.target.value)}
                                                            className={`bg-transparent border-0 outline-none text-xs p-0 w-full ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`} />
                                                    </td>
                                                    <td className="px-3 py-2 w-32">
                                                        <select value={item.owner} onChange={e => updateItem(item.id, 'owner', e.target.value)}
                                                            className={`bg-transparent border-0 outline-none text-xs p-0 w-full ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
                                                            <option value="">—</option>
                                                            {employees.filter(e => e.status === 'Active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 w-28">
                                                        <select value={item.status} onChange={e => {
                                                            const newStatus = e.target.value as PlanItem['status'];
                                                            const newProgress = newStatus === 'Done' ? 100 : newStatus === 'Not Started' ? 0 : item.progress;
                                                            updateItems(items.map(i => i.id === item.id ? { ...i, status: newStatus, progress: newProgress } : i));
                                                        }}
                                                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${sc.bg} ${sc.text}`}>
                                                            <option value="Not Started">Not Started</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Done">Done</option>
                                                            <option value="Blocked">Blocked</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 w-24">
                                                        <div className="flex items-center gap-1.5">
                                                            <input type="range" min="0" max="100" step="5" value={item.progress}
                                                                onChange={e => {
                                                                    const val = Number(e.target.value);
                                                                    const newStatus = val === 100 ? 'Done' : val === 0 ? 'Not Started' : 'In Progress';
                                                                    updateItems(items.map(i => i.id === item.id ? { ...i, progress: val, status: newStatus } : i));
                                                                }}
                                                                className="w-14 h-1 accent-primary" />
                                                            <span className={`text-[10px] font-bold w-7 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{item.progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 w-8">
                                                        <button onClick={() => deleteRow(item.id)}
                                                            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all ${dc ? 'text-dark-text hover:text-red-400' : 'text-atlassian-subtle hover:text-red-600'}`}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addRow}
                                className={`w-full py-2.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors border-t ${dc ? 'border-dark-border text-dark-text hover:bg-dark-bg' : 'border-atlassian-border text-atlassian-subtle hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span> Add row
                            </button>
                        </div>
                    )}

                    {/* View: Gantt */}
                    {view === 'gantt' && <GanttChart items={items} dark={dc} />}
                </div>
            )}

            {/* ─── Create Modal ──────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className={`rounded-xl w-full max-w-md ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 py-4 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>New Project Plan</h3>
                            <p className={`text-xs mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Pre-filled with discovery, design, development, testing & launch phases</p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Plan Title *</label>
                                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Mobile App v2.0"
                                    className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Link to Project</label>
                                <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}
                                    className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`}>
                                    <option value="">— None —</option>
                                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <button onClick={() => setShowCreate(false)}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                            <button onClick={handleCreate} disabled={!newTitle.trim()}
                                className="bg-primary text-white font-semibold py-2 px-5 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
                                Create Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPlansPage;
