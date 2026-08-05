export default function KpiCard({ label, value, icon, Icon: IconProp, tone = 'primary', sub }) {
  const Icon = IconProp || icon;
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    accent: 'bg-accent/15 text-accentDark',
    sage: 'bg-sage/25 text-primary',
    neutral: 'bg-line/40 text-body',
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-input ${tones[tone] || tones.primary} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-body font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5 leading-tight truncate">{value}</p>
          {sub && <p className="text-[11px] text-body/70 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
