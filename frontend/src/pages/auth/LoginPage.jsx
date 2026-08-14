import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import defaultData from '../../data/defaultData';
import { getEmailValidationError, normalizeEmail } from '../../utils/email';

const demoAccounts = [defaultData.credentials.admin, ...defaultData.credentials.users];
const primaryDemoAccount = demoAccounts[0];

export default function LoginPage() {
  const [email, setEmail] = useState(primaryDemoAccount.email);
  const [password, setPassword] = useState(primaryDemoAccount.password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/events');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const validate = () => {
    setFormError('');
    const nextErrors = { email: '', password: '' };
    nextErrors.email = getEmailValidationError(email);
    if (!password) {
      nextErrors.password = 'رمز عبور را وارد کنید';
    }
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      setFormError('لطفاً موارد علامت‌گذاری شده را اصلاح کنید.');
    }
    return !nextErrors.email && !nextErrors.password;
  };

  const fillTestAccount = (account) => {
    setEmail(normalizeEmail(account.email));
    setPassword(account.password);
    setShowPassword(false);
    setFormError('');
    setErrors({ email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(email.trim(), password);
      if (response.success) {
        setFormError('');
        login(response.data.token, response.data.user);
        toast.success('خوش آمدید!');
        navigate(response.data.user.role === 'ADMIN' ? '/admin/dashboard' : '/events');
      } else {
        const message = response.message || 'خطا در ورود';
        setFormError(message);
        toast.error(message);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'خطا در ارتباط با سرور';
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      <div className="lg:w-1/2 hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute top-16 left-16 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-16 right-16 w-72 h-72 bg-brand-400/15 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center justify-center px-12 py-16 text-white text-center max-w-lg">
          <div className="w-24 h-24 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 shadow-glass">
            <AcademicCapIcon className="w-11 h-11" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">سامانه رزرو صندلی</h1>
          <p className="text-lg text-white/75 mb-4">آمفی‌تئاتر دانشکده مهندسی دانشگاه بوعلی سینا</p>
          <p className="text-sm text-white/50 leading-relaxed">
            مدیریت رزرو آنلاین صندلی برای رویدادهای فرهنگی و علمی با تجربه کاربری ساده، قابل اعتماد و زیبا.
          </p>

          <div className="mt-12 grid gap-3 text-sm text-white/70">
            <div className="inline-flex items-center gap-3 text-left">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> رزرو آسان
            </div>
            <div className="inline-flex items-center gap-3 text-left">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> امنیت بالا
            </div>
            <div className="inline-flex items-center gap-3 text-left">
              <span className="w-2 h-2 rounded-full bg-accent-500" /> رابط کاربری روان
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Button
              to="/"
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-2 rounded-2xl border border-line-strong bg-surface-card/90 text-ink shadow-sm transition hover:bg-surface-muted"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              بازگشت
            </Button>
            <span className="hidden text-sm text-ink-muted sm:inline">ورود امن به سامانه</span>
          </div>

          <div className="card p-8 sm:p-10 bg-surface-card">
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-ink-strong mb-2">ورود به سامانه</h2>
              <p className="text-ink-muted">برای دسترسی به رزروها و مدیریت رویدادها وارد شوید.</p>
            </div>

            {formError ? (
              <div role="alert" aria-live="assertive" className="mb-5 rounded-2xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-ink">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                  ایمیل
                </label>
                <input
                  id="email"
                  name="ticket_reservation_demo_email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError('');
                    setErrors((current) => ({ ...current, email: '' }));
                  }}
                  className={`input-field ltr text-left ${errors.email ? 'error' : ''}`}
                  placeholder="example@gmail.com"
                  dir="ltr"
                  autoFocus
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-danger-ink">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-ink">
                    رمز عبور
                  </label>
                  <span className="text-xs text-ink-faint">حداقل ۸ کاراکتر</span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="ticket_reservation_demo_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError('');
                      setErrors((current) => ({ ...current, password: '' }));
                    }}
                    className={`input-field ltr text-left pr-10 ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    dir="ltr"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-faint transition hover:bg-surface-muted hover:text-ink"
                    aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-danger-ink">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="md"
                fullWidth
                aria-busy={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    در حال ورود...
                  </span>
                ) : (
                  'ورود به سامانه'
                )}
              </Button>

              <div className="flex flex-col items-center gap-3 pt-4 text-sm text-ink-muted">
                <p>اگر هنوز حساب کاربری ندارید،</p>
                <Link to="/register" className="font-semibold text-brand-ink hover:text-brand-ink transition-colors">
                  ثبت‌نام در سامانه
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-6 rounded-3xl border border-line-strong bg-surface-alt p-4 text-sm text-ink shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink-strong">حساب‌های آزمایشی معتبر</p>
                <p className="mt-1 text-xs text-ink-muted">اطلاعات هماهنگ با دیتابیس پروژه</p>
              </div>
              <span className="rounded-full border border-success-border bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success-ink">
                فعال
              </span>
            </div>
            <div className="grid gap-3">
              {demoAccounts.map((account) => (
                <div key={account.email} className="rounded-2xl border border-line-strong bg-surface-card p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink-strong">{account.label}</p>
                        <span className="rounded-full border border-line-strong bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                          {account.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          account.availability === 'ALWAYS'
                            ? 'border-success-border bg-success-soft text-success-ink'
                            : 'border-brand-border bg-brand-soft text-brand-ink'
                        }`}>
                          {account.availability === 'ALWAYS' ? 'همیشه موجود' : 'دیتاست کامل'}
                        </span>
                      </div>
                      <p className="ltr mt-1 break-all text-left text-xs text-ink-muted" dir="ltr">
                        {account.email}
                      </p>
                      <div className="ltr mt-1 flex flex-wrap gap-x-3 gap-y-1 text-left text-xs" dir="ltr">
                        <span className="text-ink-muted">ID: {account.student_id}</span>
                        <span className="font-semibold text-brand-ink">Password: {account.password}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillTestAccount(account)}
                      className="premium-interactive shrink-0 rounded-xl border border-brand-border bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                      استفاده از حساب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
