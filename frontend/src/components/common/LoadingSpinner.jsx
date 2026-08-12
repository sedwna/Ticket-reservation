export default function LoadingSpinner({ fullScreen = false, message = 'در حال بارگذاری...' }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent border-t-transparent"></div>
      <p className="text-ink-muted text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        {spinner}
      </div>
    );
  }

  return spinner;
}
