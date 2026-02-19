import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee, Project, Task, Blocker, MeetingMinutes, EmployeeStatus, ProjectStatus, TaskStatus, TaskPriority } from '../types';
import { useToast } from './ToastContext';

interface DataContextType {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
  meetings: MeetingMinutes[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  addProject: (proj: Omit<Project, 'id'>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  resolveBlocker: (blockerId: string) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  deleteEmployee: (id: string) => void;
  toggleEmployeeStatus: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;
  addMeeting: (m: Omit<MeetingMinutes, 'id' | 'createdAt'>) => void;
  updateMeeting: (id: string, m: Partial<Omit<MeetingMinutes, 'id' | 'createdAt'>>) => void;
  deleteMeeting: (id: string) => void;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE = '/api';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [meetings, setMeetings] = useState<MeetingMinutes[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [empRes, projRes, taskRes, blockerRes, meetRes] = await Promise.all([
        fetch(`${API_BASE}/employees`), fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/tasks`), fetch(`${API_BASE}/blockers`),
        fetch(`${API_BASE}/meetings`),
      ]);
      setEmployees(await empRes.json());
      setProjects(await projRes.json());
      setTasks(await taskRes.json());
      setBlockers(await blockerRes.json());
      setMeetings(await meetRes.json());
    } catch (e) {
      console.error('Failed to fetch data from API:', e);
      showToast('Failed to load data', 'error');
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const res = await fetch(`${API_BASE}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emp) });
    const newEmp = await res.json();
    setEmployees(prev => [...prev, newEmp]);
    showToast(`Employee "${newEmp.name}" added`);
  };

  const addProject = async (proj: Omit<Project, 'id'>) => {
    const res = await fetch(`${API_BASE}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proj) });
    const newProj = await res.json();
    setProjects(prev => [...prev, newProj]);
    showToast(`Project "${newProj.name}" created`);
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch(`${API_BASE}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) });
    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
    showToast(`Task "${newTask.title}" assigned`);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await fetch(`${API_BASE}/tasks/${taskId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    showToast(`Task status → ${status}`);
  };

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const merged = { ...task, ...updates };
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged) });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    showToast('Task updated');
  };

  const deleteTask = async (id: string) => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task deleted', 'info');
  };

  const resolveBlocker = async (blockerId: string) => {
    await fetch(`${API_BASE}/blockers/${blockerId}/resolve`, { method: 'PATCH' });
    setBlockers(prev => prev.map(b => b.id === blockerId ? { ...b, status: 'Resolved', resolvedDate: new Date().toISOString() } : b));
    showToast('Blocker resolved');
  };

  const toggleEmployeeStatus = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const newStatus = emp.status === EmployeeStatus.ACTIVE ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE;
    await fetch(`${API_BASE}/employees/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    showToast(`${emp.name} → ${newStatus}`);
  };

  const updateEmployeeStatus = async (id: string, status: EmployeeStatus) => {
    await fetch(`${API_BASE}/employees/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, status } : emp));
  };

  const deleteEmployee = async (id: string) => {
    await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setTasks(prev => prev.map(task => {
      const ids = task.assignedToId.split(',').filter(eid => eid !== id);
      return { ...task, assignedToId: ids.join(',') };
    }));
    showToast('Employee removed', 'info');
  };

  const updateProjectStatus = async (id: string, status: ProjectStatus) => {
    await fetch(`${API_BASE}/projects/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, status } : proj));
    showToast(`Project status → ${status}`);
  };

  const deleteProject = async (id: string) => {
    await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(proj => proj.id !== id));
    setTasks(prev => prev.map(task => {
      const ids = task.projectId.split(',').filter(pid => pid !== id);
      return { ...task, projectId: ids.join(',') };
    }));
    showToast('Project deleted', 'info');
  };

  const addMeeting = async (m: Omit<MeetingMinutes, 'id' | 'createdAt'>) => {
    const res = await fetch(`${API_BASE}/meetings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    const newM = await res.json();
    setMeetings(prev => [newM, ...prev]);
    showToast(`Meeting "${newM.title}" saved`);
  };

  const updateMeeting = async (id: string, updates: Partial<Omit<MeetingMinutes, 'id' | 'createdAt'>>) => {
    const existing = meetings.find(m => m.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    const res = await fetch(`${API_BASE}/meetings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged) });
    const updated = await res.json();
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    showToast('Meeting updated');
  };

  const deleteMeeting = async (id: string) => {
    await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE' });
    setMeetings(prev => prev.filter(m => m.id !== id));
    showToast('Meeting deleted', 'info');
  };

  const refreshData = () => { fetchAll(); };

  return (
    <DataContext.Provider value={{
      employees, projects, tasks, blockers, meetings,
      addEmployee, addProject, addTask, updateTaskStatus, updateTask, deleteTask,
      resolveBlocker, updateEmployeeStatus, deleteEmployee, toggleEmployeeStatus,
      updateProjectStatus, deleteProject, addMeeting, updateMeeting, deleteMeeting, refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
