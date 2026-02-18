import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ProjectStatus, TaskPriority } from '../types';

const Projects: React.FC = () => {
  const { projects, addProject, tasks, updateProjectStatus, deleteProject } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    startDate: '',
    deadline: '',
    priority: TaskPriority.MEDIUM,
    description: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({
      ...newProject,
      ownerId: 'e1', // Defaulting for demo
      status: ProjectStatus.ACTIVE
    });
    setIsModalOpen(false);
    setNewProject({ name: '', startDate: '', deadline: '', priority: TaskPriority.MEDIUM, description: '' });
  };

  const getProgress = (projId: string) => {
    const projTasks = tasks.filter(t => t.projectId === projId);
    if (projTasks.length === 0) return 0;
    const done = projTasks.filter(t => t.status === 'Done').length;
    return Math.round((done / projTasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <span>+</span> Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const progress = getProgress(project.id);
          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full hover:border-blue-300 transition-colors relative group">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project?')) {
                    deleteProject(project.id);
                  }
                }}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex justify-between items-start mb-4 pr-6">
                <span className={`px-2 py-1 text-xs font-bold rounded-md ${project.priority === 'High' || project.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  {project.priority}
                </span>
                <span className="text-xs text-slate-400 font-mono">Due: {project.deadline}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{project.name}</h3>
              <p className="text-slate-500 text-sm mb-4 flex-1">{project.description}</p>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                <select
                  value={project.status}
                  onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                  className={`text-xs font-bold border-none bg-slate-50 rounded p-1 focus:ring-1 focus:ring-blue-500 ${project.status === ProjectStatus.ACTIVE ? 'text-green-600' :
                    project.status === ProjectStatus.COMPLETED ? 'text-blue-600' : 'text-amber-600'
                    }`}
                >
                  <option value={ProjectStatus.ACTIVE}>Active</option>
                  <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                  <option value={ProjectStatus.COMPLETED}>Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4">New Project</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Project Name" className="w-full border p-2 rounded" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea placeholder="Description" className="w-full border p-2 rounded" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full border p-2 rounded" value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full border p-2 rounded" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select className="w-full border p-2 rounded" value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value as TaskPriority })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
