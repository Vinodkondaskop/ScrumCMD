import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { analyzeTeamPerformance, PromptType } from '../services/geminiService';
import Markdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const QUICK_PROMPTS: { type: PromptType; label: string; icon: string; desc: string }[] = [
  { type: 'sprint_health', label: 'Sprint Health', icon: 'monitor_heart', desc: 'Overall health score and progress' },
  { type: 'risk_report', label: 'Risk Report', icon: 'warning', desc: 'At-risk projects and mitigation' },
  { type: 'standup_notes', label: 'Standup Notes', icon: 'edit_note', desc: 'Today\'s standup summary' },
  { type: 'workload_check', label: 'Workload Check', icon: 'balance', desc: 'Team capacity analysis' },
];

const Reports: React.FC = () => {
  const { employees, projects, tasks, blockers } = useData();
  const { dark } = useTheme();
  const { showToast } = useToast();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<PromptType | null>(null);
  const [loading, setLoading] = useState(false);
  const dc = dark;

  const tasksByEmployee = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      name: emp.name.split(' ')[0],
      Done: tasks.filter(t => t.assignedToId.split(',').includes(emp.id) && t.status === 'Done').length,
      Open: tasks.filter(t => t.assignedToId.split(',').includes(emp.id) && t.status !== 'Done').length,
    }));

  const taskStatusData = [
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'Blocked').length },
    { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length },
  ];

  const COLORS = ['#36b37e', '#0052cc', '#ff5630', '#97a0af'];

  const runAnalysis = async (type: PromptType) => {
    setLoading(true);
    setActivePrompt(type);
    try {
      const report = await analyzeTeamPerformance(
        { employees, projects, tasks, blockers },
        type
      );
      setAiReport(report);
      showToast(`${QUICK_PROMPTS.find(p => p.type === type)?.label} generated`);
    } catch {
      showToast('Failed to generate report', 'error');
    }
    setLoading(false);
  };

  const exportReportCSV = () => {
    const headers = ['Employee', 'Done', 'Open'];
    const rows = tasksByEmployee.map(e => [e.name, e.Done, e.Open]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Report CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Reports & AI Insights</h2>
        <button onClick={exportReportCSV}
          className={`py-2 px-3 rounded text-sm font-medium flex items-center gap-1 border ${dc ? 'border-dark-border text-dark-text hover:bg-dark-surface' : 'border-atlassian-border text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> Export CSV
        </button>
      </div>

      {/* Quick Ask Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_PROMPTS.map(qp => (
          <button key={qp.type} onClick={() => runAnalysis(qp.type)}
            disabled={loading}
            className={`p-4 rounded border text-left transition-all group
              ${activePrompt === qp.type && !loading ? 'ring-2 ring-primary' : ''}
              ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-primary/40'}
              ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`material-symbols-outlined transition-colors ${activePrompt === qp.type ? 'text-primary' : dc ? 'text-dark-text' : 'text-atlassian-subtle'} ${!loading ? 'group-hover:text-primary' : ''}`}
                style={{ fontSize: '20px' }}>{qp.icon}</span>
              <span className={`text-sm font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{qp.label}</span>
            </div>
            <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{qp.desc}</p>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`border rounded p-8 flex flex-col items-center justify-center gap-3 ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-sm font-medium ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
            Analyzing your team data with AI...
          </p>
          <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>
            This usually takes 5-10 seconds
          </p>
        </div>
      )}

      {/* AI Report Output */}
      {aiReport && !loading && (
        <div className={`border rounded ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <div className={`px-5 py-3 border-b flex items-center justify-between ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>auto_awesome</span>
              <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>
                {QUICK_PROMPTS.find(p => p.type === activePrompt)?.label || 'AI'} Report
              </h3>
            </div>
            <button onClick={() => setAiReport(null)}
              className={`p-1 rounded transition-colors ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
          <div className={`p-6 prose prose-sm max-w-none
            ${dc ? 'prose-invert prose-headings:text-dark-text-bright prose-p:text-dark-text-bright prose-li:text-dark-text-bright prose-strong:text-dark-text-bright' : 'prose-headings:text-atlassian-text prose-p:text-atlassian-text'}`}>
            <Markdown>{aiReport}</Markdown>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`border rounded ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <div className={`px-5 py-3 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
            <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : ''}`}>Tasks per Employee</h3>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByEmployee}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dc ? '#3a3f44' : '#dfe1e6'} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: dc ? '#b6c2cf' : '#6b778c' }} />
                <YAxis tick={{ fontSize: 12, fill: dc ? '#b6c2cf' : '#6b778c' }} />
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid ' + (dc ? '#3a3f44' : '#dfe1e6'), fontSize: '12px', background: dc ? '#22272b' : '#fff', color: dc ? '#dee4ea' : '#172b4d' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Done" fill="#36b37e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Open" fill="#0052cc" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`border rounded ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
          <div className={`px-5 py-3 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
            <h3 className={`font-semibold text-sm ${dc ? 'text-dark-text-bright' : ''}`}>Task Status Distribution</h3>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {taskStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid ' + (dc ? '#3a3f44' : '#dfe1e6'), fontSize: '12px', background: dc ? '#22272b' : '#fff', color: dc ? '#dee4ea' : '#172b4d' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
