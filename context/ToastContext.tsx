import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, message, type }]);
        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timers.current.delete(id);
        }, 3000);
        timers.current.set(id, timer);
    }, []);

    useEffect(() => {
        return () => { timers.current.forEach(t => clearTimeout(t)); };
    }, []);

    const icons: Record<ToastType, string> = { success: 'check_circle', error: 'error', info: 'info' };
    const colors: Record<ToastType, string> = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-primary',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id}
                        className={`${colors[toast.type]} text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 pointer-events-auto animate-slide-in min-w-[280px]`}
                        style={{ animation: 'slideIn 0.3s ease-out' }}>
                        <span className="material-symbols-outlined !text-white" style={{ fontSize: '18px' }}>{icons[toast.type]}</span>
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-auto text-white/70 hover:text-white">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
