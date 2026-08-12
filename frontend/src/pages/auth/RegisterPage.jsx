import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const strengthLabels = ['', 'ضعیف', 'متوسط', 'خوب', 'عالی'];
const strengthColors = ['bg-surface-raised', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    student_id: '', first_name: '', last_name: '', email: '', password: '', password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) { navigate('/events'); return null; }

  const validate = () => {
    if (!form.first_name.trim()) return 'نام الزامی است';
    if (!form.last_name.trim()) return 'نام خانوادگی الزامی است';
    if (!form.student_id.trim()) return 'شماره دانشجویی الزامی است';
    if (!form.email.trim()) return 'ایمیل الزامی است';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'فرمت ایمیل نامعتبر است';
    if (!form.password) return 'رمز عبور الزامی است';
    if (form.password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    if (form.password !== form.password_confirm) return 'رمز عبور و تکرار آن یکسان نیستند';
    return null;
  };

  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const response = await authService.register({
        student_id: form.student_id, first_name: form.first_name,
        last_name: form.last_name, email: form.email, password: form.password,
      });
      if (response.success) {
        toast.success('ثبت‌نام با موفقیت انجام شد');
        navigate('/login');
      } else {
        toast.error(response.message || 'خطا در ثبت‌نام');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 py-8">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="mb-6 flex items-center">
          <Button
            to="/"
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-2 rounded-2xl border border-line-strong bg-surface-card/90 text-ink shadow-sm transition hover:bg-surface-muted"
          >
            <ArrowLeftIcon className="w-4 h-4" /> بازگشت
          </Button>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-card border border-line p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-ink-strong mb-2">ایجاد حساب کاربری</h2>
            <p className="text-ink-muted text-sm">برای رزرو صندلی در سامانه ثبت‌نام کنید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">نام *</label>
                <input type="text" value={form.first_name}
                  onChange={(e) => setForm({...form, first_name: e.target.value})}
                  className="input-field" placeholder="نام" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">نام خانوادگی *</label>
                <input type="text" value={form.last_name}
                  onChange={(e) => setForm({...form, last_name: e.target.value})}
                  className="input-field" placeholder="نام خانوادگی" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">شماره دانشجویی *</label>
              <input type="text" value={form.student_id}
                onChange={(e) => setForm({...form, student_id: e.target.value})}
                className="input-field ltr text-left" dir="ltr" placeholder="4012345" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">ایمیل *</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="input-field ltr text-left" dir="ltr" placeholder="example@basu.ac.ir" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">رمز عبور *</label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="input-field ltr text-left" dir="ltr" placeholder="حداقل ۸ کاراکتر" />
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-surface-muted'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength > 2 ? 'text-success-ink' : strength > 1 ? 'text-warning-ink' : 'text-red-500'}`}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">تکرار رمز عبور *</label>
              <input type="password" value={form.password_confirm}
                onChange={(e) => setForm({...form, password_confirm: e.target.value})}
                className={`input-field ltr text-left ${form.password_confirm && form.password !== form.password_confirm ? 'border-red-300 focus:ring-red-500/30' : ''}`}
                dir="ltr" placeholder="تکرار رمز عبور" />
              {form.password_confirm && form.password !== form.password_confirm && (
                <p className="text-red-500 text-xs mt-1">رمز عبور یکسان نیست</p>
              )}
            </div>

            <Button type="submit" disabled={loading} variant="primary" size="md" fullWidth className="mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ثبت‌نام...
                </span>
              ) : 'ایجاد حساب کاربری'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-ink-muted">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link to="/login" className="text-brand-ink hover:text-brand-ink font-semibold transition-colors">وارد شوید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
