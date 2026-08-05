import { createContext, useContext, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { Check, X, TriangleAlert, Info } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext(null);

// ── Design-system toast variants ──────────────────────────────────────
const VARIANTS = {
  success: { icon: Check, color: '#6F8F5B', label: 'Success' },
  error: { icon: X, color: '#DC2626', label: 'Oops' },
  warning: { icon: TriangleAlert, color: '#D97706', label: 'Heads up' },
  info: { icon: Info, color: '#B85C38', label: 'Good to know' },
};

function ToastBody({ message, type }) {
  const v = VARIANTS[type] || VARIANTS.info;
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-heading font-bold shrink-0 shadow-sm"
        style={{ backgroundColor: v.color }}
      >
        <v.icon className="w-4 h-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p
          className="text-[10px] font-heading font-bold uppercase tracking-[0.14em]"
          style={{ color: v.color }}
        >
          {v.label}
        </p>
        <p className="text-sm font-medium text-ink leading-snug mt-0.5">{message}</p>
      </div>
    </div>
  );
}

function toastContent(message, type) {
  return <ToastBody message={message} type={type} />;
}

export function ToastProvider({ children }) {
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    toast(toastContent(message, type), {
      type: type === 'info' ? 'default' : type,
      autoClose: duration,
      closeOnClick: true,
      pauseOnHover: true,
      pauseOnFocusLoss: false,
      draggable: true,
      hideProgressBar: false,
      icon: false,
      className: '!bg-surface !rounded-input !border !border-line !shadow-card !py-3.5 !px-4 !font-body !cursor-pointer',
      progressClassName: '!h-1',
      bodyClassName: '!p-0 !m-0',
    });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer
        position="top-right"
        newestOnTop
        closeButton={false}
        limit={5}
        toastStyle={{ borderRadius: '16px' }}
      />
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
