import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { MeetingMinutes as Meeting } from '../types';

/* ─── MultiSelect (reusable) ──────────────────────────────────── */
const MultiSelect: React.FC<{
    label: string; placeholder: string; options: { id: string; name: string }[];
    selected: string[]; onChange: (ids: string[]) => void; dark: boolean;
}> = ({ label, placeholder, options, selected, onChange, dark: dc }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{label}</label>
            <div onClick={() => setOpen(!open)}
                className={`border rounded px-3 py-2 text-sm cursor-pointer min-h-[38px] flex flex-wrap gap-1 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`}>
                {selected.length === 0 && <span className={`${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{placeholder}</span>}
                {selected.map(id => {
                    const o = options.find(x => x.id === id);
                    return o ? <span key={id} className="bg-blue-100 text-primary text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        {o.name}<button onClick={e => { e.stopPropagation(); onChange(selected.filter(s => s !== id)); }} className="hover:text-red-500">×</button>
                    </span> : null;
                })}
            </div>
            {open && (
                <div className={`absolute z-50 mt-1 left-0 right-0 border rounded shadow-lg max-h-48 overflow-y-auto ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                    {options.map(o => (
                        <label key={o.id} className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${dc ? 'hover:bg-dark-bg text-dark-text-bright' : 'hover:bg-atlassian-neutral text-atlassian-text'}`}>
                            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onChange(selected.includes(o.id) ? selected.filter(s => s !== o.id) : [...selected, o.id])} className="rounded" />
                            {o.name}
                        </label>
                    ))}
                    {options.length === 0 && <p className="px-3 py-2 text-sm text-atlassian-subtle">No options</p>}
                </div>
            )}
        </div>
    );
};

/* ─── Templates ───────────────────────────────────────────────── */
interface Template {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    title: string;
    agenda: string;
    notes: string;
    actionItems: string;
    decisions: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'blank',
        name: 'Blank Document',
        icon: 'draft',
        color: 'from-gray-400 to-gray-500',
        description: 'Start from scratch',
        title: '',
        agenda: '',
        notes: '',
        actionItems: '',
        decisions: '',
    },
    {
        id: 'sprint_planning',
        name: 'Sprint Planning',
        icon: 'rocket_launch',
        color: 'from-blue-500 to-indigo-600',
        description: 'Plan your upcoming sprint',
        title: 'Sprint Planning — Sprint #',
        agenda: `1. Review sprint goal & capacity\n2. Groom and estimate backlog items\n3. Commit to sprint scope\n4. Identify dependencies & risks`,
        notes: `## Sprint Goal\n[Define the sprint goal here]\n\n## Capacity\n- Team size: \n- Available days: \n- Total capacity (story points): \n\n## Selected Stories\n| # | Story | Points | Owner |\n|---|-------|--------|-------|\n| 1 |       |        |       |\n| 2 |       |        |       |\n| 3 |       |        |       |\n\n## Dependencies\n- `,
        actionItems: `- [ ] Create/update Jira tickets for committed stories\n- [ ] Update sprint board\n- [ ] Notify stakeholders of sprint scope`,
        decisions: `- Sprint goal: \n- Sprint duration: 2 weeks\n- Committed story points: `,
    },
    {
        id: 'daily_standup',
        name: 'Daily Standup',
        icon: 'groups',
        color: 'from-green-500 to-emerald-600',
        description: 'Quick daily sync',
        title: `Daily Standup — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
        agenda: `1. Yesterday's progress\n2. Today's plan\n3. Blockers & impediments`,
        notes: `## Team Updates\n\n**[Name 1]**\n- Yesterday: \n- Today: \n- Blockers: None\n\n**[Name 2]**\n- Yesterday: \n- Today: \n- Blockers: None\n\n**[Name 3]**\n- Yesterday: \n- Today: \n- Blockers: None`,
        actionItems: `- [ ] \n- [ ] `,
        decisions: '',
    },
    {
        id: 'retrospective',
        name: 'Sprint Retrospective',
        icon: 'psychology',
        color: 'from-purple-500 to-violet-600',
        description: 'Reflect and improve',
        title: 'Sprint Retrospective — Sprint #',
        agenda: `1. What went well? ✅\n2. What didn't go well? ❌\n3. What can we improve? 🔄\n4. Action items from last retro`,
        notes: `## ✅ What Went Well\n- \n- \n\n## ❌ What Didn't Go Well\n- \n- \n\n## 🔄 What Can We Improve\n- \n- \n\n## Previous Action Items Review\n| Action | Owner | Status |\n|--------|-------|--------|\n|        |       | ✅/❌  |`,
        actionItems: `- [ ] [Improvement 1] — Owner: \n- [ ] [Improvement 2] — Owner: \n- [ ] [Improvement 3] — Owner: `,
        decisions: `- Process change: \n- Tool change: `,
    },
    {
        id: 'sprint_review',
        name: 'Sprint Review / Demo',
        icon: 'slideshow',
        color: 'from-orange-500 to-amber-600',
        description: 'Showcase completed work',
        title: 'Sprint Review — Sprint #',
        agenda: `1. Sprint goal recap\n2. Demo of completed stories\n3. Incomplete items & carryover\n4. Stakeholder feedback\n5. Next sprint preview`,
        notes: `## Sprint Summary\n- Sprint Goal: \n- Planned: __ stories (__ pts)\n- Completed: __ stories (__ pts)\n- Velocity: __\n\n## Demo Items\n| Story | Demo'd By | Stakeholder Feedback |\n|-------|-----------|---------------------|\n|       |           |                     |\n\n## Incomplete / Carried Over\n| Story | Reason | Next Sprint? |\n|-------|--------|--------------|\n|       |        |              |`,
        actionItems: `- [ ] Incorporate stakeholder feedback\n- [ ] Move carryover items to next sprint\n- [ ] Update release notes`,
        decisions: `- Release decision: \n- Scope change: `,
    },
    {
        id: 'project_plan',
        name: 'Project Plan',
        icon: 'assignment',
        color: 'from-teal-500 to-cyan-600',
        description: 'Full project kickoff plan with phases & milestones',
        title: 'Project Plan — [Project Name]',
        agenda: `1. Project overview & objectives\n2. Scope definition\n3. Timeline & milestones\n4. Resource allocation\n5. Risk assessment\n6. Communication plan`,
        notes: `## 📋 Project Overview\n**Project Name:** \n**Project Manager:** \n**Start Date:** \n**Target End Date:** \n**Budget:** \n\n## 🎯 Objectives\n1. \n2. \n3. \n\n## 📐 Scope\n### In Scope\n- \n- \n\n### Out of Scope\n- \n- \n\n## 🗓️ Phases & Milestones\n| Phase | Description | Start | End | Owner | Status |\n|-------|-------------|-------|-----|-------|--------|\n| Phase 1 — Discovery | Requirements & research | | | | 🔲 Not Started |\n| Phase 2 — Design | Architecture & UI/UX | | | | 🔲 Not Started |\n| Phase 3 — Development | Core implementation | | | | 🔲 Not Started |\n| Phase 4 — Testing | QA & UAT | | | | 🔲 Not Started |\n| Phase 5 — Launch | Deployment & rollout | | | | 🔲 Not Started |\n\n## 👥 Team & Resources\n| Role | Name | Allocation | Responsibilities |\n|------|------|-----------|------------------|\n| Project Manager | | 100% | Overall coordination |\n| Tech Lead | | 100% | Architecture & code review |\n| Developer | | 100% | Feature development |\n| Designer | | 50% | UI/UX design |\n| QA Engineer | | 50% | Testing & quality |\n\n## ⚠️ Risks\n| Risk | Impact | Probability | Mitigation |\n|------|--------|-------------|------------|\n| | High/Med/Low | High/Med/Low | |\n| | | | |\n\n## 📡 Communication Plan\n| Meeting | Frequency | Attendees | Purpose |\n|---------|-----------|-----------|----------|\n| Standup | Daily | Dev team | Sync & blockers |\n| Sprint Review | Bi-weekly | All stakeholders | Demo & feedback |\n| Status Report | Weekly | PM + Leadership | Progress update |`,
        actionItems: `- [ ] Finalize project charter & get sign-off\n- [ ] Set up project board & repositories\n- [ ] Schedule kickoff meeting with all stakeholders\n- [ ] Define Definition of Done (DoD)\n- [ ] Create detailed Phase 1 backlog`,
        decisions: `- Tech stack: \n- Methodology: Agile/Scrum\n- Sprint duration: 2 weeks\n- Release strategy: `,
    },
];

/* ─── Main Page ─────────────────────────────────────────────── */
const MeetingMinutesPage: React.FC = () => {
    const { meetings, projects, employees, addMeeting, updateMeeting, deleteMeeting } = useData();
    const { dark } = useTheme();
    const dc = dark;
    const printRef = useRef<HTMLDivElement>(null);

    // Modal state
    const [showTemplates, setShowTemplates] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState('');
    const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
    const [agenda, setAgenda] = useState('');
    const [notes, setNotes] = useState('');
    const [actionItems, setActionItems] = useState('');
    const [decisions, setDecisions] = useState('');

    const resetForm = () => {
        setTitle(''); setDate(new Date().toISOString().split('T')[0]); setProjectId('');
        setAttendeeIds([]); setAgenda(''); setNotes(''); setActionItems(''); setDecisions('');
        setEditId(null);
    };

    const openFromTemplate = (t: Template) => {
        resetForm();
        setTitle(t.title); setAgenda(t.agenda); setNotes(t.notes);
        setActionItems(t.actionItems); setDecisions(t.decisions);
        setShowTemplates(false); setShowForm(true);
    };

    const openEdit = (m: Meeting) => {
        setEditId(m.id); setTitle(m.title); setDate(m.date); setProjectId(m.projectId);
        setAttendeeIds(m.attendeeIds ? m.attendeeIds.split(',').filter(Boolean) : []);
        setAgenda(m.agenda); setNotes(m.notes); setActionItems(m.actionItems); setDecisions(m.decisions);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !date) return;
        const data = { title, date, projectId, attendeeIds: attendeeIds.join(','), agenda, notes, actionItems, decisions };
        if (editId) { await updateMeeting(editId, data); } else { await addMeeting(data); }
        setShowForm(false); resetForm();
    };

    const handleDownloadPDF = () => {
        if (!viewMeeting) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const m = viewMeeting;
        const attendeeNames = m.attendeeIds ? m.attendeeIds.split(',').filter(Boolean).map(id => employees.find(e => e.id === id)?.name || '').filter(Boolean).join(', ') : 'None';
        const projName = projects.find(p => p.id === m.projectId)?.name || '—';

        // Convert markdown-style tables to HTML tables
        const mdToHtml = (text: string) => {
            const lines = text.split('\n');
            let html = '';
            let inTable = false;
            let tableRows: string[][] = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('|') && line.endsWith('|')) {
                    const cells = line.split('|').slice(1, -1).map(c => c.trim());
                    // Skip separator rows
                    if (cells.every(c => /^[-:]+$/.test(c))) continue;
                    if (!inTable) { inTable = true; tableRows = []; }
                    tableRows.push(cells);
                } else {
                    if (inTable) {
                        html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:13px">';
                        tableRows.forEach((row, ri) => {
                            const tag = ri === 0 ? 'th' : 'td';
                            const bg = ri === 0 ? 'background:#f4f5f7;font-weight:700;' : ri % 2 === 0 ? 'background:#fafbfc;' : '';
                            html += '<tr>' + row.map(c => `<${tag} style="border:1px solid #dfe1e6;padding:8px 12px;text-align:left;${bg}">${c}</${tag}>`).join('') + '</tr>';
                        });
                        html += '</table>';
                        inTable = false; tableRows = [];
                    }
                    // Handle markdown headers
                    if (line.startsWith('## ')) {
                        html += `<h3 style="font-size:14px;font-weight:700;color:#0052cc;margin:16px 0 6px">${line.slice(3)}</h3>`;
                    } else if (line.startsWith('### ')) {
                        html += `<h4 style="font-size:13px;font-weight:700;color:#344563;margin:12px 0 4px">${line.slice(4)}</h4>`;
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                        html += `<p style="font-weight:700;margin:4px 0">${line.slice(2, -2)}</p>`;
                    } else if (line.startsWith('- [ ] ')) {
                        html += `<div style="margin:3px 0;padding-left:4px">☐ ${line.slice(6)}</div>`;
                    } else if (line.startsWith('- [x] ')) {
                        html += `<div style="margin:3px 0;padding-left:4px">☑ ${line.slice(6)}</div>`;
                    } else if (line.startsWith('- ')) {
                        html += `<div style="margin:3px 0;padding-left:4px">• ${line.slice(2)}</div>`;
                    } else if (line) {
                        html += `<p style="margin:4px 0">${line}</p>`;
                    }
                }
            }
            // Flush remaining table
            if (inTable && tableRows.length) {
                html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:13px">';
                tableRows.forEach((row, ri) => {
                    const tag = ri === 0 ? 'th' : 'td';
                    const bg = ri === 0 ? 'background:#f4f5f7;font-weight:700;' : ri % 2 === 0 ? 'background:#fafbfc;' : '';
                    html += '<tr>' + row.map(c => `<${tag} style="border:1px solid #dfe1e6;padding:8px 12px;text-align:left;${bg}">${c}</${tag}>`).join('') + '</tr>';
                });
                html += '</table>';
            }
            return html;
        };

        printWindow.document.write(`<!DOCTYPE html><html><head><title>${m.title}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #172b4d; line-height: 1.6; }
      .header { border-bottom: 3px solid #0052cc; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 24px; color: #0052cc; margin-bottom: 4px; }
      .meta { display: flex; gap: 24px; font-size: 13px; color: #6b778c; margin-top: 8px; flex-wrap: wrap; }
      .meta strong { color: #172b4d; }
      .section { margin-bottom: 20px; page-break-inside: avoid; }
      .section h2 { font-size: 15px; font-weight: 700; color: #0052cc; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #dfe1e6; padding-bottom: 6px; margin-bottom: 10px; }
      .section-content { font-size: 14px; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #dfe1e6; font-size: 11px; color: #97a0af; text-align: center; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <div class="header">
        <h1>📋 ${m.title}</h1>
        <div class="meta">
          <span><strong>Date:</strong> ${m.date}</span>
          <span><strong>Project:</strong> ${projName}</span>
        </div>
        <div class="meta" style="margin-top:4px">
          <span><strong>Attendees:</strong> ${attendeeNames}</span>
        </div>
      </div>
      ${m.agenda ? `<div class="section"><h2>📌 Agenda</h2><div class="section-content">${mdToHtml(m.agenda)}</div></div>` : ''}
      ${m.notes ? `<div class="section"><h2>📝 Notes</h2><div class="section-content">${mdToHtml(m.notes)}</div></div>` : ''}
      ${m.actionItems ? `<div class="section"><h2>✅ Action Items</h2><div class="section-content">${mdToHtml(m.actionItems)}</div></div>` : ''}
      ${m.decisions ? `<div class="section"><h2>⚖️ Decisions</h2><div class="section-content">${mdToHtml(m.decisions)}</div></div>` : ''}
      <div class="footer">Generated from ScrumCMD • ${new Date().toLocaleDateString()}</div>
    </body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    // Render markdown-style content as formatted text
    const renderContent = (text: string) => {
        if (!text) return null;
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let tableRows: string[][] = [];
        let inTable = false;
        let key = 0;

        const flushTable = () => {
            if (tableRows.length === 0) return;
            elements.push(
                <div key={key++} className="overflow-x-auto my-2">
                    <table className={`w-full text-xs border-collapse ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                        <thead>
                            <tr>
                                {tableRows[0].map((cell, ci) => (
                                    <th key={ci} className={`border px-3 py-2 text-left font-bold text-xs ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-gray-50 border-atlassian-border text-atlassian-text'}`}>{cell}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.slice(1).map((row, ri) => (
                                <tr key={ri}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} className={`border px-3 py-2 text-xs ${dc ? 'border-dark-border text-dark-text-bright' : 'border-atlassian-border text-atlassian-text'}`}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                const cells = line.split('|').slice(1, -1).map(c => c.trim());
                if (cells.every(c => /^[-:]+$/.test(c))) continue;
                if (!inTable) { inTable = true; tableRows = []; }
                tableRows.push(cells);
            } else {
                if (inTable) { flushTable(); inTable = false; }
                if (line.startsWith('## ')) {
                    elements.push(<h4 key={key++} className={`text-sm font-bold mt-3 mb-1 ${dc ? 'text-primary' : 'text-primary'}`}>{line.slice(3)}</h4>);
                } else if (line.startsWith('### ')) {
                    elements.push(<h5 key={key++} className={`text-xs font-bold mt-2 mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{line.slice(4)}</h5>);
                } else if (line.startsWith('- [ ] ')) {
                    elements.push(<div key={key++} className={`flex items-center gap-2 text-sm ml-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}><span className="w-4 h-4 rounded border border-gray-300 inline-flex items-center justify-center text-[10px]"></span>{line.slice(6)}</div>);
                } else if (line.startsWith('- [x] ')) {
                    elements.push(<div key={key++} className={`flex items-center gap-2 text-sm ml-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}><span className="w-4 h-4 rounded bg-green-500 text-white inline-flex items-center justify-center text-[10px]">✓</span><span className="line-through opacity-60">{line.slice(6)}</span></div>);
                } else if (line.startsWith('- ')) {
                    elements.push(<div key={key++} className={`text-sm ml-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>• {line.slice(2)}</div>);
                } else if (line.match(/^\d+\.\s/)) {
                    elements.push(<div key={key++} className={`text-sm ml-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{line}</div>);
                } else if (line.startsWith('**') && line.endsWith('**')) {
                    elements.push(<p key={key++} className={`text-sm font-bold mt-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{line.slice(2, -2)}</p>);
                } else if (line) {
                    elements.push(<p key={key++} className={`text-sm ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{line}</p>);
                } else {
                    elements.push(<div key={key++} className="h-2" />);
                }
            }
        }
        if (inTable) flushTable();
        return <>{elements}</>;
    };

    const activeProjects = projects.filter(p => p.status === 'Active');
    const activeEmployees = employees.filter(e => e.status === 'Active');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Meeting Minutes</h2>
                    <p className={`text-sm mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{meetings.length} document{meetings.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowTemplates(true)}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition-colors text-sm">
                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
                    New Document
                </button>
            </div>

            {/* Empty State */}
            {meetings.length === 0 && !showForm && !showTemplates && (
                <div className={`border rounded-xl p-12 flex flex-col items-center justify-center gap-3 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                    <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '48px' }}>description</span>
                    <p className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>No meeting docs yet</p>
                    <p className={`text-sm text-center max-w-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Create your first meeting minutes using one of our Notion-style templates</p>
                    <button onClick={() => setShowTemplates(true)} className="mt-2 bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary-hover transition-colors">
                        Browse Templates
                    </button>
                </div>
            )}

            {/* Meeting Cards Grid */}
            {meetings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.map(m => {
                        const proj = projects.find(p => p.id === m.projectId);
                        const attIds = m.attendeeIds ? m.attendeeIds.split(',').filter(Boolean) : [];
                        return (
                            <div key={m.id} className={`border rounded-lg p-5 hover:shadow-md transition-all cursor-pointer group relative ${dc ? 'bg-dark-surface border-dark-border hover:border-primary/40' : 'bg-white border-atlassian-border hover:border-primary/40'}`}
                                onClick={() => setViewMeeting(m)}>
                                <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${m.title}"?`)) deleteMeeting(m.id); }}
                                    className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${dc ? 'text-dark-text hover:bg-dark-bg hover:text-red-400' : 'text-atlassian-subtle hover:bg-red-50 hover:text-red-600'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${dc ? 'bg-dark-bg text-primary' : 'bg-blue-50 text-primary'}`}>{m.date}</span>
                                    {proj && <span className={`text-xs font-medium px-2 py-0.5 rounded ${dc ? 'bg-dark-bg text-dark-text' : 'bg-gray-100 text-atlassian-subtle'}`}>{proj.name}</span>}
                                </div>
                                <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{m.title}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                        {attIds.slice(0, 4).map(id => {
                                            const emp = employees.find(e => e.id === id);
                                            const ini = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                                            return <div key={id} title={emp?.name} className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-primary border-2 border-white dark:border-dark-surface">{ini}</div>;
                                        })}
                                    </div>
                                    {attIds.length > 0 && <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{attIds.length} attendee{attIds.length !== 1 ? 's' : ''}</span>}
                                </div>
                                {m.agenda && <p className={`text-xs mt-3 line-clamp-2 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{m.agenda}</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Template Picker Modal ──────────────────────────── */}
            {showTemplates && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowTemplates(false)}>
                    <div className={`rounded-xl w-full max-w-3xl my-8 ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 py-5 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <div>
                                <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Choose a Template</h3>
                                <p className={`text-sm mt-0.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Start with a pre-filled structure or blank document</p>
                            </div>
                            <button onClick={() => setShowTemplates(false)}
                                className={`p-1.5 rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {TEMPLATES.map(t => (
                                <button key={t.id} onClick={() => openFromTemplate(t)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg group ${dc ? 'bg-dark-bg border-dark-border hover:border-primary' : 'bg-white border-gray-200 hover:border-primary'}`}>
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
                                        <span className="material-symbols-outlined !text-white" style={{ fontSize: '20px' }}>{t.icon}</span>
                                    </div>
                                    <h4 className={`font-semibold text-sm mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{t.name}</h4>
                                    <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{t.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── View Modal ─────────────────────────────────────── */}
            {viewMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setViewMeeting(null)}>
                    <div className={`rounded-xl w-full max-w-3xl my-8 ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{viewMeeting.title}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { openEdit(viewMeeting); setViewMeeting(null); }}
                                    className={`p-1.5 rounded transition-colors ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                </button>
                                <button onClick={handleDownloadPDF}
                                    className="bg-primary text-white font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-sm hover:bg-primary-hover transition-colors">
                                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>download</span>
                                    PDF
                                </button>
                                <button onClick={() => setViewMeeting(null)}
                                    className={`p-1.5 rounded transition-colors ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                                </button>
                            </div>
                        </div>
                        <div ref={printRef} className="px-6 py-5 space-y-5">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div><span className={`font-bold ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Date: </span><span className={dc ? 'text-dark-text-bright' : ''}>{viewMeeting.date}</span></div>
                                <div><span className={`font-bold ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Project: </span><span className={dc ? 'text-dark-text-bright' : ''}>{projects.find(p => p.id === viewMeeting.projectId)?.name || '—'}</span></div>
                            </div>
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Attendees</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {(viewMeeting.attendeeIds ? viewMeeting.attendeeIds.split(',').filter(Boolean) : []).map(id => {
                                        const emp = employees.find(e => e.id === id);
                                        return emp ? <span key={id} className="bg-blue-100 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{emp.name}</span> : null;
                                    })}
                                    {(!viewMeeting.attendeeIds || viewMeeting.attendeeIds.split(',').filter(Boolean).length === 0) && <span className={`text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>None specified</span>}
                                </div>
                            </div>
                            {[
                                { label: '📌 Agenda', value: viewMeeting.agenda },
                                { label: '📝 Discussion Notes', value: viewMeeting.notes },
                                { label: '✅ Action Items', value: viewMeeting.actionItems },
                                { label: '⚖️ Decisions Made', value: viewMeeting.decisions },
                            ].filter(s => s.value).map(s => (
                                <div key={s.label}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${dc ? 'text-primary' : 'text-primary'}`}>{s.label}</h4>
                                    <div className={`leading-relaxed ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{renderContent(s.value)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Create / Edit Modal ─────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => { setShowForm(false); resetForm(); }}>
                    <div className={`rounded-xl w-full max-w-3xl my-8 ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{editId ? 'Edit Document' : 'New Document'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }}
                                className={`p-1 rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Title *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint 4 Planning"
                                        className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Date *</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                        className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Project</label>
                                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                                    className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`}>
                                    <option value="">— No project —</option>
                                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <MultiSelect label="Attendees" placeholder="Select attendees..." options={activeEmployees.map(e => ({ id: e.id, name: e.name }))} selected={attendeeIds} onChange={setAttendeeIds} dark={dc} />
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Agenda</label>
                                <textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={4} placeholder="What was planned to discuss..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y font-mono ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Discussion Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={8} placeholder="Key discussion points, updates shared..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y font-mono ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Action Items</label>
                                <textarea value={actionItems} onChange={e => setActionItems(e.target.value)} rows={4} placeholder="- [ ] John: Complete API docs by Friday"
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y font-mono ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Decisions Made</label>
                                <textarea value={decisions} onChange={e => setDecisions(e.target.value)} rows={3} placeholder="Key decisions agreed upon..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y font-mono ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                        </div>
                        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <button onClick={() => { setShowForm(false); resetForm(); }}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                            <button onClick={handleSave} disabled={!title.trim() || !date}
                                className="bg-primary text-white font-semibold py-2 px-5 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
                                {editId ? 'Save Changes' : 'Create Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingMinutesPage;
