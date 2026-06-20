import { Link } from 'react-router-dom';
import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'موردی یافت نشد',
  description,
  linkTo,
  linkText,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>
      )}
      {linkTo && linkText && (
        <Link to={linkTo} className="btn-primary">
          {linkText}
        </Link>
      )}
    </div>
  );
}
