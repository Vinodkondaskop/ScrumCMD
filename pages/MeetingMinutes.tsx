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

/* ─── Main Page ─────────────────────────────────────────────── */
const MeetingMinutesPage: React.FC = () => {
    const { meetings, projects, employees, addMeeting, updateMeeting, deleteMeeting } = useData();
    const { dark } = useTheme();
    const dc = dark;
    const printRef = useRef<HTMLDivElement>(null);

    // Modal state
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

    const openCreate = () => { resetForm(); setShowForm(true); };

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
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const m = viewMeeting!;
        const attendeeNames = m.attendeeIds ? m.attendeeIds.split(',').filter(Boolean).map(id => employees.find(e => e.id === id)?.name || '').filter(Boolean).join(', ') : 'None';
        const projName = projects.find(p => p.id === m.projectId)?.name || '—';
        printWindow.document.write(`<!DOCTYPE html><html><head><title>${m.title}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #172b4d; line-height: 1.6; }
      .header { border-bottom: 3px solid #0052cc; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 24px; color: #0052cc; margin-bottom: 4px; }
      .meta { display: flex; gap: 24px; font-size: 13px; color: #6b778c; margin-top: 8px; }
      .meta strong { color: #172b4d; }
      .section { margin-bottom: 20px; }
      .section h2 { font-size: 15px; font-weight: 700; color: #0052cc; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #dfe1e6; padding-bottom: 6px; margin-bottom: 10px; }
      .section-content { font-size: 14px; white-space: pre-wrap; }
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
      ${m.agenda ? `<div class="section"><h2>📌 Agenda</h2><div class="section-content">${m.agenda.replace(/\n/g, '<br>')}</div></div>` : ''}
      ${m.notes ? `<div class="section"><h2>📝 Discussion Notes</h2><div class="section-content">${m.notes.replace(/\n/g, '<br>')}</div></div>` : ''}
      ${m.actionItems ? `<div class="section"><h2>✅ Action Items</h2><div class="section-content">${m.actionItems.replace(/\n/g, '<br>')}</div></div>` : ''}
      ${m.decisions ? `<div class="section"><h2>⚖️ Decisions Made</h2><div class="section-content">${m.decisions.replace(/\n/g, '<br>')}</div></div>` : ''}
      <div class="footer">Generated from ScrumCMD • ${new Date().toLocaleDateString()}</div>
    </body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
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
                <button onClick={openCreate}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition-colors text-sm">
                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
                    New Meeting
                </button>
            </div>

            {/* Empty State */}
            {meetings.length === 0 && !showForm && (
                <div className={`border rounded p-12 flex flex-col items-center justify-center gap-3 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
                    <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '48px' }}>description</span>
                    <p className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>No meeting docs yet</p>
                    <p className={`text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Create your first meeting minutes to get started</p>
                    <button onClick={openCreate} className="mt-2 bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary-hover transition-colors">
                        Create Meeting Doc
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
                                {/* Delete button */}
                                <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${m.title}"?`)) deleteMeeting(m.id); }}
                                    className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${dc ? 'text-dark-text hover:bg-dark-bg hover:text-red-400' : 'text-atlassian-subtle hover:bg-red-50 hover:text-red-600'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                                {/* Date badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${dc ? 'bg-dark-bg text-primary' : 'bg-blue-50 text-primary'}`}>{m.date}</span>
                                    {proj && <span className={`text-xs font-medium px-2 py-0.5 rounded ${dc ? 'bg-dark-bg text-dark-text' : 'bg-gray-100 text-atlassian-subtle'}`}>{proj.name}</span>}
                                </div>
                                {/* Title */}
                                <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{m.title}</h3>
                                {/* Attendees */}
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                        {attIds.slice(0, 4).map(id => {
                                            const emp = employees.find(e => e.id === id);
                                            const ini = emp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                                            return <div key={id} title={emp?.name} className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-primary border-2 border-white dark:border-dark-surface">{ini}</div>;
                                        })}
                                    </div>
                                    <span className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{attIds.length} attendee{attIds.length !== 1 ? 's' : ''}</span>
                                </div>
                                {/* Preview */}
                                {m.agenda && <p className={`text-xs mt-3 line-clamp-2 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{m.agenda}</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── View Modal ─────────────────────────────────────── */}
            {viewMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setViewMeeting(null)}>
                    <div className={`rounded-lg w-full max-w-2xl my-8 ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{viewMeeting.title}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { openEdit(viewMeeting); setViewMeeting(null); }}
                                    className={`p-1.5 rounded transition-colors ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                </button>
                                <button onClick={handleDownloadPDF}
                                    className="bg-primary text-white font-medium py-1.5 px-3 rounded flex items-center gap-1.5 text-sm hover:bg-primary-hover transition-colors">
                                    <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>download</span>
                                    PDF
                                </button>
                                <button onClick={() => setViewMeeting(null)}
                                    className={`p-1.5 rounded transition-colors ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                                </button>
                            </div>
                        </div>
                        {/* Content */}
                        <div ref={printRef} className="px-6 py-5 space-y-5">
                            {/* Meta */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div><span className={`font-bold ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Date: </span><span className={dc ? 'text-dark-text-bright' : ''}>{viewMeeting.date}</span></div>
                                <div><span className={`font-bold ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Project: </span><span className={dc ? 'text-dark-text-bright' : ''}>{projects.find(p => p.id === viewMeeting.projectId)?.name || '—'}</span></div>
                            </div>
                            {/* Attendees */}
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
                            {/* Sections */}
                            {[
                                { label: '📌 Agenda', value: viewMeeting.agenda },
                                { label: '📝 Discussion Notes', value: viewMeeting.notes },
                                { label: '✅ Action Items', value: viewMeeting.actionItems },
                                { label: '⚖️ Decisions Made', value: viewMeeting.decisions },
                            ].filter(s => s.value).map(s => (
                                <div key={s.label}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-primary' : 'text-primary'}`}>{s.label}</h4>
                                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Create / Edit Modal ─────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => { setShowForm(false); resetForm(); }}>
                    <div className={`rounded-lg w-full max-w-2xl my-8 ${dc ? 'bg-dark-surface' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <h3 className={`font-semibold text-lg ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{editId ? 'Edit Meeting' : 'New Meeting'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }}
                                className={`p-1 rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Row: Title + Date */}
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
                            {/* Project */}
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Project</label>
                                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                                    className={`w-full border rounded px-3 py-2 text-sm ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`}>
                                    <option value="">— No project —</option>
                                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            {/* Attendees */}
                            <MultiSelect label="Attendees" placeholder="Select attendees..." options={activeEmployees.map(e => ({ id: e.id, name: e.name }))} selected={attendeeIds} onChange={setAttendeeIds} dark={dc} />
                            {/* Agenda */}
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Agenda</label>
                                <textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={3} placeholder="What was planned to discuss..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            {/* Discussion Notes */}
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Discussion Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Key discussion points, updates shared..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            {/* Action Items */}
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Action Items</label>
                                <textarea value={actionItems} onChange={e => setActionItems(e.target.value)} rows={3} placeholder="- John: Complete API docs by Friday&#10;- Sara: Review PR #42"
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                            {/* Decisions */}
                            <div>
                                <label className={`block text-xs font-bold mb-1 ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Decisions Made</label>
                                <textarea value={decisions} onChange={e => setDecisions(e.target.value)} rows={2} placeholder="Key decisions agreed upon..."
                                    className={`w-full border rounded px-3 py-2 text-sm resize-y ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-white border-atlassian-border text-atlassian-text'}`} />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
                            <button onClick={() => { setShowForm(false); resetForm(); }}
                                className={`py-2 px-4 rounded text-sm font-medium ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                            <button onClick={handleSave} disabled={!title.trim() || !date}
                                className="bg-primary text-white font-semibold py-2 px-5 rounded text-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
                                {editId ? 'Save Changes' : 'Create Meeting'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingMinutesPage;
