import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Assign Task', path: '/daily-update', icon: '📋' },
    { name: 'Employees', path: '/employees', icon: '👥' },
    { name: 'Projects', path: '/projects', icon: '📁' },
    { name: 'Tasks', path: '/tasks', icon: '✅' },
    { name: 'Reports & AI', path: '/reports', icon: '📈' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-blue-500">⚡</span> ScrumCmd
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Manager Console</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            Admin
          </div>
          <div>
            <p className="text-sm font-medium text-white">System Admin</p>
            <p className="text-xs text-slate-500">Logged in</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
