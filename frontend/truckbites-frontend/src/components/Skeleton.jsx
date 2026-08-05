// Skeleton loaders for data-fetching states.
// Uses the `.skeleton` shimmer classes defined in index.css.

export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ className = '', width = 'w-full' }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      <div className={`skeleton-text h-3.5 ${width}`} />
      <div className="skeleton-text h-3.5 w-4/5" />
      <div className="skeleton-text h-3.5 w-2/3" />
    </div>
  );
}

export function TruckCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden" aria-hidden="true">
      <div className="skeleton h-40 rounded-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton-text h-5 w-3/4" />
        <div className="skeleton-text h-3.5 w-24" />
        <div className="skeleton-text h-3.5 w-full" />
        <div className="skeleton h-[46px] rounded-full mt-4" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="card p-5 space-y-3" aria-hidden="true">
      <div className="flex justify-between gap-4">
        <div className="skeleton-text h-5 w-2/3" />
        <div className="skeleton-text h-5 w-14" />
      </div>
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton-text h-3.5 w-full" />
      <div className="skeleton-text h-3.5 w-4/5" />
      <div className="skeleton h-[46px] rounded-full mt-2" />
    </div>
  );
}

export function PageHeadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="skeleton-text h-8 w-64" />
      <div className="skeleton-text h-4 w-80 max-w-full" />
    </div>
  );
}
