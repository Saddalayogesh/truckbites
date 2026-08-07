import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const OPTIONS = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeToggle() {
  const { mode, resolvedTheme, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const ActiveIcon = OPTIONS.find((o) => o.mode === mode)?.Icon ?? Sun;
  const ResolvedIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${mode}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Theme"
        className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-line bg-surface text-body hover:text-primary hover:border-primary/40 transition-all duration-200"
      >
        <ActiveIcon className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {open && (
        <div
          role="radiogroup"
          aria-label="Theme options"
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-line bg-surface shadow-glass backdrop-blur-xl animate-drop-in z-50 p-1.5"
        >
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-body/60">
            Theme
          </p>
          {OPTIONS.map(({ mode: m, label, Icon }) => {
            const active = m === mode;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setMode(m);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-body hover:bg-primary/5 hover:text-ink'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active ? 'text-primary' : 'text-body/80'
                  }`}
                  strokeWidth={1.8}
                />
                <span className="flex-1 text-left">{label}</span>
                {m === 'system' && !active && (
                  <ResolvedIcon
                    className="h-3.5 w-3.5 shrink-0 text-body/50"
                    strokeWidth={2}
                    aria-label={`System is currently ${resolvedTheme}`}
                  />
                )}
                {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
          <p className="px-3 pt-1.5 pb-1 text-[11px] text-body/50">
            System follows your device setting
          </p>
        </div>
      )}
    </div>
  );
}
