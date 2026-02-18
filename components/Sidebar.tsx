import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Sidebar: React.FC = () => {
  const { dark, toggleDark } = useTheme();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Assign Task', path: '/daily-update', icon: 'add_box' },
    { name: 'Employees', path: '/employees', icon: 'group' },
    { name: 'Projects', path: '/projects', icon: 'view_kanban' },
    { name: 'Tasks', path: '/tasks', icon: 'check_box' },
    { name: 'Reports & AI', path: '/reports', icon: 'insights' },
  ];

  return (
    <aside className={`w-64 border-r h-screen fixed left-0 top-0 flex flex-col z-50 ${dark ? 'bg-dark-bg border-dark-border' : 'bg-atlassian-neutral border-atlassian-border'}`}>
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '18px' }}>grid_view</span>
        </div>
        <div>
          <h1 className={`font-bold text-lg leading-none ${dark ? 'text-dark-text-bright' : 'text-atlassian-text'}`}>ScrumCmd</h1>
          <p className={`text-xs font-medium ${dark ? 'text-dark-text' : 'text-atlassian-subtle'}`}>Agile Management</p>
        </div>
      </div>
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                ? 'nav-item-active font-semibold'
                : dark ? 'hover:bg-dark-surface text-dark-text' : 'hover:bg-gray-200 text-atlassian-text'
              }`
            }>
            <span className={`material-symbols-outlined ${dark ? 'text-dark-text' : 'text-atlassian-subtle'}`} style={{ fontSize: '20px' }}>{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 space-y-3 mt-auto">
        {/* Dark Mode Toggle */}
        <button onClick={toggleDark}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${dark ? 'bg-dark-surface text-dark-text-bright hover:bg-dark-border' : 'bg-white text-atlassian-text hover:bg-gray-100 border border-atlassian-border'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <NavLink to="/daily-update"
          className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors">
          <span className="material-symbols-outlined !text-white" style={{ fontSize: '16px' }}>add</span>
          <span className="text-sm">Assign Task</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
