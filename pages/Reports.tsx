import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { analyzeTeamPerformance } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const { employees, projects, tasks, blockers } = useData();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tasksByEmployee = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      name: emp.name.split(' ')[0],
      Done: tasks.filter(t => t.assignedToId === emp.id && t.status === 'Done').length,
      Open: tasks.filter(t => t.assignedToId === emp.id && t.status !== 'Done').length,
    }));

  const taskStatusData = [
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'Blocked').length },
    { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length },
  ];

  const COLORS = ['#36b37e', '#0052cc', '#ff5630', '#97a0af'];

  const generateAIReport = async () => {
    setLoading(true);
    const report = await analyzeTeamPerformance({ employees, projects, tasks, recentUpdates: [], blockers });
    setAiReport(report);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-atlassian-text">Reports & AI Insights</h2>
        <button onClick={generateAIReport} disabled={loading}
          className={`font-semibold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors ${loading ? 'bg-atlassian-neutral text-atlassian-subtle cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}>
          <span className="material-symbols-outlined !text-sm" style={{ fontSize: '16px' }}>{loading ? 'hourglass_empty' : 'auto_awesome'}</span>
          {loading ? 'Analyzing...' : 'Ask AI Scrum Master'}
        </button>
      </div>

      {/* AI Report */}
      {aiReport && (
        <div className="bg-white border border-atlassian-border rounded">
          <div className="px-5 py-3 border-b border-atlassian-border flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>auto_awesome</span>
            <h3 className="font-semibold text-sm text-atlassian-text">AI Performance Report</h3>
          </div>
          <div className="p-5 text-sm text-atlassian-text whitespace-pre-wrap leading-relaxed">{aiReport}</div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-atlassian-border rounded">
          <div className="px-5 py-3 border-b border-atlassian-border">
            <h3 className="font-semibold text-sm">Tasks per Employee</h3>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByEmployee}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe1e6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b778c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b778c' }} />
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Done" fill="#36b37e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Open" fill="#0052cc" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-atlassian-border rounded">
          <div className="px-5 py-3 border-b border-atlassian-border">
            <h3 className="font-semibold text-sm">Task Status Distribution</h3>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {taskStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px' }} />
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
