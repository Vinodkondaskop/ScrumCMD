import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DailyUpdateForm from './pages/DailyUpdateForm';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Global Search component
const GlobalSearch: React.FC = () => {
  const { tasks, employees, projects } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { tasks: [], employees: [], projects: [] };
    const q = query.toLowerCase();
    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5),
      employees: employees.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)).slice(0, 5),
      projects: projects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, tasks, employees, projects]);

  const hasResults = results.tasks.length + results.employees.length + results.projects.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 border border-atlassian-border dark:border-dark-border rounded bg-atlassian-neutral dark:bg-dark-surface px-3 py-1.5">
        <span className="material-symbols-outlined text-atlassian-subtle dark:text-dark-text" style={{ fontSize: '18px' }}>search</span>
        <input type="text" placeholder="Search tasks, people, projects…" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="bg-transparent border-none outline-none text-sm w-full text-atlassian-text dark:text-dark-text-bright placeholder:text-atlassian-subtle dark:placeholder:text-dark-text" />
        {query && <button onClick={() => { setQuery(''); setOpen(false); }} className="text-atlassian-subtle hover:text-atlassian-text dark:text-dark-text">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>}
      </div>
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-surface border border-atlassian-border dark:border-dark-border rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {!hasResults && <p className="px-4 py-3 text-sm text-atlassian-subtle">No results for "{query}"</p>}
          {results.employees.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-bold text-atlassian-subtle uppercase tracking-wider bg-atlassian-neutral dark:bg-dark-bg">People</p>
              {results.employees.map(e => (
                <button key={e.id} onClick={() => { navigate(`/employees/${e.id}`); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-4 py-2 hover:bg-atlassian-neutral dark:hover:bg-dark-bg flex items-center gap-2 text-sm transition-colors">
                  <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '16px' }}>person</span>
                  <span className="text-atlassian-text dark:text-dark-text-bright">{e.name}</span>
                  <span className="text-xs text-atlassian-subtle ml-auto">{e.role}</span>
                </button>
              ))}
            </div>
          )}
          {results.projects.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-bold text-atlassian-subtle uppercase tracking-wider bg-atlassian-neutral dark:bg-dark-bg">Projects</p>
              {results.projects.map(p => (
                <button key={p.id} onClick={() => { navigate('/projects'); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-4 py-2 hover:bg-atlassian-neutral dark:hover:bg-dark-bg flex items-center gap-2 text-sm transition-colors">
                  <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '16px' }}>folder</span>
                  <span className="text-atlassian-text dark:text-dark-text-bright">{p.name}</span>
                  <span className={`text-[10px] font-bold ml-auto ${p.status === 'Active' ? 'text-green-600' : 'text-atlassian-subtle'}`}>{p.status}</span>
                </button>
              ))}
            </div>
          )}
          {results.tasks.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-bold text-atlassian-subtle uppercase tracking-wider bg-atlassian-neutral dark:bg-dark-bg">Tasks</p>
              {results.tasks.map(t => (
                <button key={t.id} onClick={() => { navigate('/tasks'); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-4 py-2 hover:bg-atlassian-neutral dark:hover:bg-dark-bg flex items-center gap-2 text-sm transition-colors">
                  <span className="material-symbols-outlined text-atlassian-subtle" style={{ fontSize: '16px' }}>task_alt</span>
                  <span className="text-atlassian-text dark:text-dark-text-bright">{t.title}</span>
                  <span className={`text-[10px] font-bold ml-auto ${t.status === 'Done' ? 'text-green-600' : 'text-atlassian-subtle'}`}>{t.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { dark } = useTheme();

  return (
    <Router>
      <div className={`flex h-screen overflow-hidden font-display ${dark ? 'bg-dark-bg' : 'bg-background-light'}`}>
        <Sidebar />
        <main className={`flex-1 ml-64 flex flex-col min-w-0 overflow-hidden ${dark ? 'bg-dark-surface' : 'bg-white'}`}>
          {/* Top Header with Search */}
          <div className={`flex items-center px-8 py-3 border-b ${dark ? 'border-dark-border' : 'border-atlassian-border'}`}>
            <GlobalSearch />
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/daily-update" element={<DailyUpdateForm />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/:id" element={<EmployeeProfile />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
