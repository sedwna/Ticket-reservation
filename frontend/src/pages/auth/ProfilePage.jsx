import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, EnvelopeIcon, IdentificationIcon, ShieldCheckIcon,
  PencilSquareIcon, CheckIcon, XMarkIcon, KeyIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }
    setSaving(true);
    try {
      const r = await authService.updateProfile(form.first_name, form.last_name, form.email);
      if (r.success) {
        const updated = r.data;
        const token = localStorage.getItem('token');
        login(token, { ...user, first_name: updated.first_name, last_name: updated.last_name, email: updated.email });
        toast.success('پروفایل به‌روزرسانی شد');
        setEditing(false);
      } else {
        toast.error(r.message || 'خطا');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در به‌روزرسانی');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.old || !pwForm.new) { toast.error('فیلدها را پر کنید'); return; }
    if (pwForm.new.length < 8) { toast.error('رمز عبور جدید باید حداقل ۸ کاراکتر باشد'); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error('رمز عبور جدید یکسان نیست'); return; }
    setPwSaving(true);
    try {
      const r = await authService.changePassword(pwForm.old, pwForm.new);
      if (r.success) {
        toast.success('رمز عبور تغییر کرد');
        setPwModal(false);
        setPwForm({ old: '', new: '', confirm: '' });
      } else {
        toast.error(r.message || 'خطا');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در تغییر رمز عبور');
    } finally { setPwSaving(false); }
  };

  if (!user) return null;

  const fields = [
    { label: 'نام', value: user.first_name, icon: UserCircleIcon },
    { label: 'نام خانوادگی', value: user.last_name, icon: UserCircleIcon },
    { label: 'ایمیل', value: user.email, icon: EnvelopeIcon, ltr: true },
    { label: 'شماره دانشجویی', value: user.student_id, icon: IdentificationIcon, ltr: true },
    { label: 'نقش', value: user.role === 'ADMIN' ? 'مدیر' : 'کاربر عادی', icon: ShieldCheckIcon, badge: true },
  ];

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content max-w-3xl animate-fade-in-up">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6">
          <ArrowRightIcon className="w-4 h-4" /> بازگشت
        </button>

        {/* Profile Header */}
        <div className="card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-brand-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-slate-900">{user.first_name} {user.last_name}</h2>
              <p className="text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full">
                  {user.role === 'ADMIN' ? 'مدیر' : 'کاربر عادی'}
                </span>
                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-xs text-slate-400">{user.is_active ? 'فعال' : 'غیرفعال'}</span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-outline text-sm">
              <PencilSquareIcon className="w-4 h-4" />
              ویرایش پروفایل
            </button>
          </div>
        </div>

        {/* Profile Details / Edit Form */}
        {editing ? (
          <div className="card p-8 mb-6 animate-slide-down">
            <h3 className="text-lg font-bold text-slate-900 mb-6">ویرایش اطلاعات</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نام</label>
                <input type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی</label>
                <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ایمیل</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field ltr text-left" dir="ltr" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary"><CheckIcon className="w-4 h-4" />{saving ? 'ذخیره...' : 'ذخیره'}</button>
                <button type="button" onClick={() => { setEditing(false); setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email }); }} className="btn-ghost"><XMarkIcon className="w-4 h-4" />انصراف</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-8 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">اطلاعات حساب</h3>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-4 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{f.label}</p>
                    <p className={`font-medium text-slate-800 ${f.ltr ? 'ltr text-left' : ''}`} dir={f.ltr ? 'ltr' : undefined}>
                      {f.value}
                    </p>
                  </div>
                  {f.badge && (
                    <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full">
                      {f.value}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-4 py-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <KeyIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">رمز عبور</p>
                  <p className="font-medium text-slate-800">••••••••</p>
                </div>
                <button onClick={() => setPwModal(true)} className="btn-ghost text-sm">تغییر</button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal (inline styled card) */}
        {pwModal && (
          <div className="card p-8 mb-6 animate-slide-down border-2 border-brand-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-brand-600" /> تغییر رمز عبور
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور فعلی</label>
                <input type="password" value={pwForm.old} onChange={e => setPwForm({...pwForm, old: e.target.value})} className="input-field ltr text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور جدید</label>
                <input type="password" value={pwForm.new} onChange={e => setPwForm({...pwForm, new: e.target.value})} className="input-field ltr text-left" dir="ltr" placeholder="حداقل ۸ کاراکتر" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تکرار رمز جدید</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} className={`input-field ltr text-left ${pwForm.confirm && pwForm.new !== pwForm.confirm ? 'border-red-300' : ''}`} dir="ltr" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={pwSaving} className="btn-primary"><CheckIcon className="w-4 h-4" />{pwSaving ? 'ذخیره...' : 'ذخیره'}</button>
                <button type="button" onClick={() => { setPwModal(false); setPwForm({ old: '', new: '', confirm: '' }); }} className="btn-ghost">انصراف</button>
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
