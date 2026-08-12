const variants = {
  success: 'bg-success-soft text-success-ink border-success-border',
  danger: 'bg-danger-soft text-danger-ink border-danger-border',
  warning: 'bg-warning-soft text-warning-ink border-warning-border',
  info: 'bg-brand-soft text-brand-ink border-brand-border',
  neutral: 'bg-surface-alt text-ink-muted border-line-strong',
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
