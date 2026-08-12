import { Link } from 'react-router-dom';

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  icon: 'btn-icon',
};

const sizeClasses = {
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-6 py-2.5',
  lg: 'text-base px-8 py-3',
  icon: 'w-10 h-10 p-0',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  to,
  className = '',
  ...props
}) {
  const classes = [
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
