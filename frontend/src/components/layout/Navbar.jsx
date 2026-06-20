import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
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
                <h1 className="text-base font-bold text-slate-800 leading-tight">سامانه رزرو صندلی</h1>
                <p className="text-xs text-slate-400 leading-tight">آمفی‌تئاتر دانشکده مهندسی</p>
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
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
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
              {isAuthenticated ? (
                <>
                  {/* User pill */}
                  <Link to="/profile" className="hidden sm:flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                    <UserCircleIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {user?.first_name} {user?.last_name}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                        مدیر
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-2">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">خروج</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">ورود</Link>
                  <Link to="/register" className="btn-primary text-sm !py-2">ثبت‌نام</Link>
                </div>
              )}

              {/* Mobile hamburger */}
              {isAuthenticated && (
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden btn-icon"
                  aria-label="منو"
                >
                  {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && isAuthenticated && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                پروفایل
              </Link>
              <hr className="my-2 border-slate-100" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all"
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
