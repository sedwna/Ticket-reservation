import { Link } from 'react-router-dom';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">سامانه رزرو صندلی</h3>
                <p className="text-xs text-slate-400">آمفی‌تئاتر دانشکده مهندسی</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              رزرو آنلاین و آسان صندلی برای رویدادها، سمینارها و برنامه‌های دانشکده
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">دسترسی سریع</h4>
            <div className="space-y-2">
              <Link to="/events" className="block text-sm text-slate-400 hover:text-white transition-colors">رویدادها</Link>
              <Link to="/my-reservations" className="block text-sm text-slate-400 hover:text-white transition-colors">رزروهای من</Link>
              <Link to="/login" className="block text-sm text-slate-400 hover:text-white transition-colors">ورود</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">تماس</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p>دانشگاه بوعلی سینا</p>
              <p>دانشکده مهندسی</p>
              <p>همدان، ایران</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} سامانه رزرو صندلی. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-slate-500">
            سجاد دهقان و فاطمه دماوندی
          </p>
        </div>
      </div>
    </footer>
  );
}
