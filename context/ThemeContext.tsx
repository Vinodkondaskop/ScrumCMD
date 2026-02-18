import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    dark: boolean;
    toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggleDark: () => { } });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dark, setDark] = useState(() => {
        try { return localStorage.getItem('scrumcmd-dark') === 'true'; } catch { return false; }
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('scrumcmd-dark', String(dark));
    }, [dark]);

    const toggleDark = () => setDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ dark, toggleDark }}>
            {children}
        </ThemeContext.Provider>
    );
};
