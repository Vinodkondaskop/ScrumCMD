import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee, Project, Task, Blocker, EmployeeStatus, ProjectStatus, TaskStatus, TaskPriority } from '../types';

interface DataContextType {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  addProject: (proj: Omit<Project, 'id'>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  resolveBlocker: (blockerId: string) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  deleteEmployee: (id: string) => void;
  toggleEmployeeStatus: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE = '/api';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [blockers, setBlockers] = useState<Blocker[]>([]);

  // Fetch all data from API on mount
  const fetchAll = useCallback(async () => {
    try {
      const [empRes, projRes, taskRes, blockerRes] = await Promise.all([
        fetch(`${API_BASE}/employees`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/blockers`),
      ]);
      setEmployees(await empRes.json());
      setProjects(await projRes.json());
      setTasks(await taskRes.json());
      setBlockers(await blockerRes.json());
    } catch (e) {
      console.error('Failed to fetch data from API:', e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    const newEmp = await res.json();
    setEmployees(prev => [...prev, newEmp]);
  };

  const addProject = async (proj: Omit<Project, 'id'>) => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj),
    });
    const newProj = await res.json();
    setProjects(prev => [...prev, newProj]);
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await fetch(`${API_BASE}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  };



  const resolveBlocker = async (blockerId: string) => {
    await fetch(`${API_BASE}/blockers/${blockerId}/resolve`, {
      method: 'PATCH',
    });
    setBlockers(prev => prev.map(b => b.id === blockerId ? { ...b, status: 'Resolved', resolvedDate: new Date().toISOString() } : b));
  };

  const toggleEmployeeStatus = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const newStatus = emp.status === EmployeeStatus.ACTIVE ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE;
    await fetch(`${API_BASE}/employees/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  };

  const updateEmployeeStatus = async (id: string, status: EmployeeStatus) => {
    await fetch(`${API_BASE}/employees/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, status } : emp));
  };

  const deleteEmployee = async (id: string) => {
    await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setTasks(prev => prev.map(task => task.assignedToId === id ? { ...task, assignedToId: '' } : task));
  };

  const updateProjectStatus = async (id: string, status: ProjectStatus) => {
    await fetch(`${API_BASE}/projects/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, status } : proj));
  };

  const deleteProject = async (id: string) => {
    await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(proj => proj.id !== id));
    setTasks(prev => prev.filter(task => task.projectId !== id));
  };

  const refreshData = () => {
    fetchAll();
  };

  return (
    <DataContext.Provider value={{
      employees,
      projects,
      tasks,
      blockers,
      addEmployee,
      addProject,
      addTask,
      updateTaskStatus,
      resolveBlocker,
      updateEmployeeStatus,
      deleteEmployee,
      toggleEmployeeStatus,
      updateProjectStatus,
      deleteProject,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
