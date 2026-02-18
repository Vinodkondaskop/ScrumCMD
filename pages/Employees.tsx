import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { EmployeeStatus } from '../types';

const Employees: React.FC = () => {
  const { employees, addEmployee, deleteEmployee, toggleEmployeeStatus } = useData();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', email: '', status: EmployeeStatus.ACTIVE, joinedDate: '' });
  const dc = dark;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee(newEmp);
    setIsModalOpen(false);
    setNewEmp({ name: '', role: '', email: '', status: EmployeeStatus.ACTIVE, joinedDate: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Team Roster</h2>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover transition-colors text-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>person_add</span>
          Add Employee
        </button>
      </div>

      <div className={`border rounded overflow-x-auto ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b ${dc ? 'bg-dark-bg border-dark-border' : 'bg-atlassian-neutral border-atlassian-border'}`}>
              {['Employee', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${dc ? 'text-dark-text' : 'text-atlassian-subtle'} ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${dc ? 'divide-dark-border' : 'divide-atlassian-border'}`}>
            {employees.map(emp => {
              const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase();
              return (
                <tr key={emp.id} className={`transition-colors ${dc ? 'hover:bg-dark-bg' : 'hover:bg-atlassian-neutral'}`}>
                  <td className="px-5 py-4 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-primary">{initials}</div>
                      <div>
                        <p className={`text-sm font-semibold text-primary hover:underline`}>{emp.name}</p>
                        <p className={`text-xs ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>{emp.role}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleEmployeeStatus(emp.id)}
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-atlassian-subtle'}`}>
                      {emp.status}
                    </button>
                  </td>
                  <td className={`px-5 py-4 text-sm ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{emp.joinedDate}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => { if (confirm(`Remove "${emp.name}"?`)) deleteEmployee(emp.id); }}
                      className={`p-1 rounded transition-colors ${dc ? 'hover:bg-dark-bg text-dark-text hover:text-red-400' : 'hover:bg-red-50 text-atlassian-subtle hover:text-red-600'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className={`rounded-xl w-full max-w-md border ${dc ? 'bg-dark-surface border-dark-border' : 'bg-white border-atlassian-border'}`} style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div className={`px-6 py-4 border-b ${dc ? 'border-dark-border' : 'border-atlassian-border'}`}>
              <h3 className={`font-semibold ${dc ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>Add Employee</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {['Name', 'Role', 'Email'].map(field => (
                <div key={field}>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>{field} <span className="text-red-500">*</span></label>
                  <input type={field === 'Email' ? 'email' : 'text'} placeholder={field}
                    value={(newEmp as any)[field.toLowerCase()]} onChange={e => setNewEmp({ ...newEmp, [field.toLowerCase()]: e.target.value })}
                    className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
                </div>
              ))}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dc ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Joined Date <span className="text-red-500">*</span></label>
                <input type="date" value={newEmp.joinedDate} onChange={e => setNewEmp({ ...newEmp, joinedDate: e.target.value })}
                  className={`w-full border rounded text-sm px-3 py-2 ${dc ? 'bg-dark-bg border-dark-border text-dark-text-bright' : 'bg-atlassian-neutral border-atlassian-border'} focus:ring-1 focus:ring-primary`} required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-sm rounded ${dc ? 'text-dark-text hover:bg-dark-bg' : 'text-atlassian-subtle hover:bg-atlassian-neutral'}`}>Cancel</button>
                <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-hover text-sm">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
