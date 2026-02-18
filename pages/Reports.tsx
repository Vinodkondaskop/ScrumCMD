import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { analyzeTeamPerformance } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const { employees, projects, tasks, blockers } = useData();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tasks per employee
  const tasksByEmployee = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      name: emp.name,
      total: tasks.filter(t => t.assignedToId === emp.id).length,
      done: tasks.filter(t => t.assignedToId === emp.id && t.status === 'Done').length,
      open: tasks.filter(t => t.assignedToId === emp.id && t.status !== 'Done').length,
    }));

  const taskStatusData = [
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'Blocked').length },
    { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#94a3b8'];

  const generateAIReport = async () => {
    setLoading(true);
    const report = await analyzeTeamPerformance({
      employees,
      projects,
      tasks,
      recentUpdates: [],
      blockers
    });
    setAiReport(report);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
        <button
          onClick={generateAIReport}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
        >
          {loading ? (
            <>
              <span className="animate-spin">🔄</span> Analyzing...
            </>
          ) : (
            <>
              <span>✨</span> Ask AI Scrum Master
            </>
          )}
        </button>
      </div>

      {aiReport && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
          <h2 className="text-lg font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">AI Performance Report</h2>
          <div className="prose prose-indigo max-w-none text-slate-800 text-sm whitespace-pre-wrap">
            {aiReport}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Chart 1: Tasks per Employee */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">Tasks per Employee</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByEmployee}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="done" fill="#10b981" name="Done" radius={[4, 4, 0, 0]} />
                <Bar dataKey="open" fill="#3b82f6" name="Open" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">Task Status Distribution</h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
