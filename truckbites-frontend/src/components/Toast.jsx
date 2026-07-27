import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: '\u2705',
  error: '\u274c',
  warning: '\u26a0\ufe0f',
  info: '\u2139\ufe0f',
};

const COLORS = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={COLORS[toast.type] + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 cursor-pointer transition-all duration-300 hover:opacity-90'}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span className="text-lg flex-shrink-0">{ICONS[toast.type]}</span>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
