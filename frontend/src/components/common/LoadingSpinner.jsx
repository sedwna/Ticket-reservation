export default function LoadingSpinner({ fullScreen = false, message = 'در حال بارگذاری...' }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-12 h-12 border-4 border-[#1A3C5E] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
