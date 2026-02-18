import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EmployeeStatus } from '../types';

const Employees: React.FC = () => {
  const { employees, tasks, addEmployee, updateEmployeeStatus, deleteEmployee } = useData();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Employee State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      name: newName,
      role: newRole,
      email: newEmail,
      status: EmployeeStatus.ACTIVE,
      joinedDate: new Date().toISOString().split('T')[0],
      avatarUrl: `https://picsum.photos/200?random=${Math.random()}`
    });
    setIsModalOpen(false);
    setNewName(''); setNewRole(''); setNewEmail('');
  };





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Team Roster</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
        >
          <span>+</span> Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-semibold">Employee</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Active Tasks</th>
              <th className="p-4 font-semibold text-right">Total Tasks</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                  <img src={emp.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                  <div>
                    <div className="font-bold text-blue-600 hover:underline">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.email}</div>
                  </div>
                </td>
                <td className="p-4 text-slate-700 font-medium">{emp.role}</td>
                <td className="p-4">
                  <select
                    value={emp.status}
                    onChange={(e) => updateEmployeeStatus(emp.id, e.target.value as EmployeeStatus)}
                    className={`text-xs font-bold border-none bg-slate-50 rounded p-1 focus:ring-1 focus:ring-blue-500 ${emp.status === EmployeeStatus.ACTIVE ? 'text-green-700' : 'text-slate-500'
                      }`}
                  >
                    <option value={EmployeeStatus.ACTIVE}>Active</option>
                    <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                  </select>
                </td>
                <td className="p-4 text-slate-600">{tasks.filter(t => t.assignedToId === emp.id && t.status !== 'Done').length}</td>
                <td className="p-4 text-right">
                  <span className="font-mono font-bold text-slate-800">{tasks.filter(t => t.assignedToId === emp.id).length}</span>
                  <span className="text-slate-400 text-xs ml-1">tasks</span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${emp.name}?`)) {
                        deleteEmployee(emp.id);
                      }
                    }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Employee"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Full Name" className="w-full border p-2 rounded" value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Frontend Dev" className="w-full border p-2 rounded" value={newRole} onChange={e => setNewRole(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="Email Address" className="w-full border p-2 rounded" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
