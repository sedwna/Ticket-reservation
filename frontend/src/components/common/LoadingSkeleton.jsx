export function CardSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-line p-6 space-y-4">
      <div className="skeleton h-4 w-24 rounded-md" />
      <div className="skeleton h-6 w-3/4 rounded-md" />
      <div className="skeleton h-4 w-1/2 rounded-md" />
      <div className="skeleton h-2.5 w-full rounded-full" />
      <div className="skeleton h-10 w-full rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-surface-card rounded-2xl border border-line p-6 space-y-4">
      <div className="skeleton h-10 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-8 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-line p-6 flex items-center gap-4">
      <div className="skeleton w-14 h-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-16 rounded-md" />
        <div className="skeleton h-8 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function SeatMapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-16 w-3/4 mx-auto rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 justify-center">
            <div className="skeleton w-6 h-6 rounded-md" />
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="skeleton w-8 h-8 rounded-md" />
              ))}
            </div>
            <div className="skeleton w-6 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ fullScreen = false, variant = 'card', message = 'در حال بارگذاری...' }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-surface">
        <div className="w-12 h-12 rounded-full border-4 border-brand-border border-t-brand-700 animate-spin" />
        <p className="text-sm text-ink-faint">{message}</p>
      </div>
    );
  }

  if (variant === 'table') return <TableSkeleton />;
  if (variant === 'stat-cards') return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  );
  if (variant === 'seatmap') return <SeatMapSkeleton />;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-10 h-10 rounded-full border-3 border-brand-border border-t-brand-700 animate-spin" />
      <p className="text-sm text-ink-faint">{message}</p>
    </div>
  );
}
