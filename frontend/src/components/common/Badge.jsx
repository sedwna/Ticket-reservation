const variants = {
  success: 'bg-success-50 text-success-600 border-success-500/20',
  danger: 'bg-red-50 text-red-600 border-red-500/20',
  warning: 'bg-amber-50 text-amber-600 border-amber-500/20',
  info: 'bg-brand-50 text-brand-700 border-brand-500/20',
  neutral: 'bg-slate-50 text-slate-500 border-slate-500/20',
};

const labels = {
  ACTIVE: 'فعال',
  CLOSED: 'پایان ثبت‌نام',
  CANCELLED: 'لغو شده',
  COMPLETED: 'برگزار شده',
  AVAILABLE: 'آزاد',
  RESERVED: 'رزرو شده',
  ADMIN: 'مدیر',
  USER: 'کاربر',
};

const statusVariants = {
  ACTIVE: 'success',
  CLOSED: 'warning',
  CANCELLED: 'danger',
  COMPLETED: 'neutral',
  AVAILABLE: 'success',
  RESERVED: 'danger',
  ADMIN: 'info',
  USER: 'neutral',
};

export default function Badge({ status, customLabel, variant = 'neutral', size = 'sm', className = '' }) {
  const resolvedVariant = status ? (statusVariants[status] || 'neutral') : variant;
  const label = customLabel || (status ? (labels[status] || status) : '');
  const colorClasses = variants[resolvedVariant] || variants.neutral;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses} ${colorClasses} ${className}`}>
      {label}
    </span>
  );
}
