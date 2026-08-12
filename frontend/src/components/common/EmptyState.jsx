import { InboxIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'موردی یافت نشد',
  description,
  linkTo,
  linkText,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-surface-muted flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-ink-subtle" />
      </div>
      <h3 className="text-xl font-bold text-ink-strong mb-2">{title}</h3>
      {description && (
        <p className="text-ink-faint text-sm max-w-sm mb-6">{description}</p>
      )}
      {linkTo && linkText && (
        <Button to={linkTo} variant="primary" size="md">
          {linkText}
        </Button>
      )}
    </div>
  );
}
