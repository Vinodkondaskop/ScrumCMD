import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EmployeeStatus } from '../types';

const Employees: React.FC = () => {
  const { employees, tasks, addEmployee, updateEmployeeStatus, deleteEmployee } = useData();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      name: newName, role: newRole, email: newEmail,
      status: EmployeeStatus.ACTIVE, joinedDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
    setNewName(''); setNewRole(''); setNewEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-atlassian-text">Team Roster</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>person_add</span>
          Add Employee
        </button>
      </div>

      <div className="bg-white border border-atlassian-border rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-atlassian-neutral border-b border-atlassian-border">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Employee</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Role</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Status</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Active Tasks</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle">Total Tasks</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-atlassian-subtle text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-atlassian-border">
            {employees.map(emp => {
              const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase();
              return (
                <tr key={emp.id} className="hover:bg-atlassian-neutral transition-colors">
                  <td className="px-5 py-4 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-primary">{initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-primary hover:underline">{emp.name}</p>
                        <p className="text-xs text-atlassian-subtle">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-atlassian-subtle">{emp.role}</td>
                  <td className="px-5 py-4">
                    <select value={emp.status} onChange={e => updateEmployeeStatus(emp.id, e.target.value as EmployeeStatus)}
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border-none ${emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-atlassian-subtle'}`}>
                      <option value={EmployeeStatus.ACTIVE}>Active</option>
                      <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-atlassian-text">{tasks.filter(t => t.assignedToId === emp.id && t.status !== 'Done').length}</td>
                  <td className="px-5 py-4 text-sm text-atlassian-subtle">{tasks.filter(t => t.assignedToId === emp.id).length}</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => { if (confirm(`Delete ${emp.name}?`)) deleteEmployee(emp.id); }}
                      className="p-1 hover:bg-red-50 rounded text-atlassian-subtle hover:text-red-600 transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md border border-atlassian-border" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className="px-6 py-4 border-b border-atlassian-border">
              <h3 className="font-semibold text-atlassian-text">Add Employee</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Full Name" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Role <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Frontend Dev" value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-atlassian-subtle uppercase tracking-wider mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="email@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-atlassian-border rounded bg-atlassian-neutral focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm px-3 py-2" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-atlassian-subtle hover:bg-atlassian-neutral rounded transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
