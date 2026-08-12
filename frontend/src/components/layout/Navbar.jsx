import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/authContext';
import {
  TicketIcon, UserCircleIcon, ArrowRightOnRectangleIcon,
  Squares2X2Icon, CalendarDaysIcon, UsersIcon,
  ChartBarIcon, Bars3Icon, XMarkIcon, AcademicCapIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const adminLinks = [
  { to: '/admin/dashboard', label: 'داشبورد', icon: Squares2X2Icon },
  { to: '/admin/events', label: 'رویدادها', icon: CalendarDaysIcon },
  { to: '/admin/users', label: 'کاربران', icon: UsersIcon },
  { to: '/admin/reports', label: 'گزارش‌ها', icon: ChartBarIcon },
];

const userLinks = [
  { to: '/events', label: 'رویدادها', icon: CalendarDaysIcon },
  { to: '/my-reservations', label: 'رزروهای من', icon: TicketIcon },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const links = isAdmin ? adminLinks : userLinks;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav role="navigation" aria-label="Main navigation" className="sticky top-0 z-50 border-b border-line/80 bg-surface-card/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-surface-card/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              to={isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/events') : '/'}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-800 text-white flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <AcademicCapIcon className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-ink-strong leading-tight">سامانه رزرو صندلی</h1>
                <p className="text-xs text-ink-faint leading-tight">آمفی‌تئاتر دانشکده مهندسی</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(link.to)
                        ? 'bg-brand-soft text-brand-ink'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  {/* User pill */}
                  <Link to="/profile" className="hidden sm:flex items-center gap-2.5 bg-surface-alt rounded-xl px-3 py-1.5 border border-line hover:bg-surface-muted transition-colors cursor-pointer">
                    <UserCircleIcon className="w-5 h-5 text-ink-faint" />
                    <span className="text-sm font-medium text-ink">
                      {user?.first_name} {user?.last_name}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-semibold bg-brand-muted text-brand-ink px-2 py-0.5 rounded-full">
                        مدیر
                      </span>
                    )}
                  </Link>
                  <Button onClick={handleLogout} variant="ghost" size="sm" className="px-3 py-2">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">خروج</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button to="/login" variant="ghost" size="sm">ورود</Button>
                  <Button to="/register" variant="primary" size="sm" className="!py-2">ثبت‌نام</Button>
                </div>
              )}

              {/* Mobile hamburger */}
              {isAuthenticated && (
                <Button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  variant="icon"
                  size="icon"
                  className="md:hidden"
                  aria-label="منو"
                >
                  {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && isAuthenticated && (
          <div id="mobile-menu" className="md:hidden border-t border-line bg-surface-card animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-brand-soft text-brand-ink'
                      : 'text-ink hover:bg-surface-alt'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-surface-alt transition-all"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                پروفایل
              </Link>
              <hr className="my-2 border-line" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-danger-soft w-full transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                خروج از حساب
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
