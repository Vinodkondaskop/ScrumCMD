import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'PM-CMD' && password === 'vinod@pm') {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/');
            window.location.reload(); // Force reload to refresh auth state in App
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-atlassian-neutral dark:bg-dark-bg font-display">
            <div className="w-full max-w-md p-8 bg-white dark:bg-dark-surface rounded shadow-xl border border-atlassian-border dark:border-dark-border">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-atlassian-blue dark:bg-dark-accent rounded flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '28px' }}>rocket_launch</span>
                    </div>
                    <h1 className="text-2xl font-bold text-atlassian-text dark:text-dark-text-bright">ScrumCMD</h1>
                    <p className="text-atlassian-subtle dark:text-dark-text text-sm">Log in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-atlassian-subtle dark:text-dark-text uppercase mb-1.5 tracking-wider">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-atlassian-neutral dark:bg-dark-bg border border-atlassian-border dark:border-dark-border rounded text-atlassian-text dark:text-dark-text-bright focus:border-atlassian-blue dark:focus:border-dark-accent outline-none transition-colors"
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-atlassian-subtle dark:text-dark-text uppercase mb-1.5 tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-atlassian-neutral dark:bg-dark-bg border border-atlassian-border dark:border-dark-border rounded text-atlassian-text dark:text-dark-text-bright focus:border-atlassian-blue dark:focus:border-dark-accent outline-none transition-colors"
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-atlassian-blue dark:bg-dark-accent hover:bg-atlassian-blue-dark dark:hover:bg-opacity-90 text-white font-bold rounded transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                        Login
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-atlassian-border dark:border-dark-border text-center">
                    <p className="text-xs text-atlassian-subtle dark:text-dark-text">
                        © 2026 ScrumCMD Platform
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
