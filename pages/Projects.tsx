import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ProjectStatus, TaskPriority } from '../types';

const Projects: React.FC = () => {
  const { projects, addProject, tasks, updateProjectStatus, deleteProject } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '', startDate: '', deadline: '', priority: TaskPriority.MEDIUM, description: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ ...newProject, ownerId: 'e1', status: ProjectStatus.ACTIVE });
    setIsModalOpen(false);
    setNewProject({ name: '', startDate: '', deadline: '', priority: TaskPriority.MEDIUM, description: '' });
  };

  const getProgress = (projId: string) => {
    const projTasks = tasks.filter(t => t.projectId === projId);
    if (projTasks.length === 0) return 0;
    return Math.round((projTasks.filter(t => t.status === 'Done').length / projTasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-atlassian-text">Projects</h2>
          <p className="text-sm text-atlassian-subtle mt-0.5">Manage and track your active engineering initiatives.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-atlassian-border rounded p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>folder_open</span>
          </div>
          <p className="text-sm font-medium text-atlassian-text">No projects found</p>
          <p className="text-xs text-atlassian-subtle mt-1">Create a new project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const progress = getProgress(project.id);
            const taskCount = tasks.filter(t => t.projectId === project.id).length;
            return (
              <div key={project.id} className="bg-white border border-atlassian-border rounded p-5 hover:shadow-sm transition-shadow relative group">
                <button onClick={() => { if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id); }}
                  className="absolute top-4 right-4 p-1 hover:bg-red-50 rounded text-atlassian-subtle hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${project.priority === 'High' || project.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-primary'}`}>
                    {project.priority}
                  </span>
                  <span className="text-xs text-atlassian-subtle ml-auto">Due: {project.deadline}</span>
                </div>

                <h3 className="text-sm font-bold text-atlassian-text mb-1">{project.name}</h3>
                <p className="text-xs text-atlassian-subtle mb-4 line-clamp-2">{project.description}</p>

                <div className="mb-4">
                  <select value={project.status} onChange={e => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border-none ${project.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-800' : project.status === ProjectStatus.COMPLETED ? 'bg-blue-100 text-primary' : 'bg-yellow-100 text-yellow-800'}`}>
                    <option value={ProjectStatus.ACTIVE}>Active</option>
                    <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                    <option value={ProjectStatus.COMPLETED}>Completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-atlassian-subtle">{taskCount} tasks</span>
                    <span className="font-semibold text-atlassian-text">{progress}%</span>
                  </div>
                  <div className="w-full bg-atlassian-neutral rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg border border-atlassian-border" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className="px-6 py-4 border-b border-atlassian-border">
              <h3 className="font-semibold text-atlassian-text">New Project</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Project Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Description</label>
                <textarea placeholder="Description" rows={2} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Deadline <span className="text-red-500">*</span></label>
                  <input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Priority</label>
                <select value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value as TaskPriority })}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary text-sm px-3 py-2">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-atlassian-subtle hover:bg-atlassian-neutral rounded">Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
