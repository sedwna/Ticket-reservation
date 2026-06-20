import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate(isAdmin ? '/admin/dashboard' : '/events');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('لطفاً ایمیل و رمز عبور را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        login(response.data.token, response.data.user);
        toast.success('خوش آمدید!');
        navigate(response.data.user.role === 'ADMIN' ? '/admin/dashboard' : '/events');
      } else {
        toast.error(response.message || 'خطا در ورود');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center justify-center w-full text-white p-16">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <AcademicCapIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 text-balance text-center">
            سامانه رزرو صندلی
          </h1>
          <p className="text-xl text-white/70 mb-2">آمفی‌تئاتر دانشکده مهندسی</p>
          <p className="text-white/40 text-sm text-center max-w-sm leading-relaxed">
            دانشگاه بوعلی سینا — رزرو آنلاین و آسان صندلی برای رویدادهای علمی، فرهنگی و آموزشی
          </p>

          <div className="mt-12 flex gap-6 text-white/40 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> رزرو آسان
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> مدیریت هوشمند
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> مشاهده لحظه‌ای
            </span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8">
            <ArrowLeftIcon className="w-4 h-4" />
            بازگشت به صفحه اصلی
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">ورود به سامانه</h2>
            <p className="text-slate-500">برای رزرو صندلی وارد حساب کاربری خود شوید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ایمیل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field ltr text-left"
                placeholder="example@basu.ac.ir"
                dir="ltr"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field ltr text-left pr-10"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 !text-base !rounded-xl">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ورود...
                </span>
              ) : 'ورود به سامانه'}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="text-brand-700 hover:text-brand-900 font-semibold transition-colors">
              ثبت‌نام کنید
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-4 text-xs text-slate-400">اطلاعات تست</span>
            </div>
          </div>

          <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 text-sm text-slate-600">
            <p className="font-semibold text-brand-800 mb-2">👤 حساب مدیر:</p>
            <p className="ltr text-left mb-1" dir="ltr">admin@basu.ac.ir / REMOVED_SECRET</p>
            <p className="font-semibold text-brand-800 mt-3 mb-2">👤 حساب کاربر:</p>
            <p className="ltr text-left" dir="ltr">test@basu.ac.ir / REMOVED_SECRET</p>
          </div>
        </div>
      </div>
    </div>
  );
}
