import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Slide-over detail panel used across admin tabs. */
export default function Drawer({ title, subtitle, onClose, children, width = 'max-w-xl' }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <aside
        className={`absolute right-0 top-0 h-full w-full ${width} bg-surface shadow-card-hover border-l border-line flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-line">
          <div className="min-w-0">
            <h2 className="text-lg font-heading font-semibold text-ink truncate">{title}</h2>
            {subtitle && <p className="text-xs text-body/70 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-body/60 hover:text-ink p-1 rounded-lg hover:bg-cream shrink-0 ml-3"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}
