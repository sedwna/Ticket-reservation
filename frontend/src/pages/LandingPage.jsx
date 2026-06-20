import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  AcademicCapIcon, TicketIcon, ChartBarIcon, EyeIcon,
  ArrowLeftIcon, ShieldCheckIcon, DevicePhoneMobileIcon,
  CalendarDaysIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import publicService from '../services/publicService';
import { useScrollReveal, useCountUp, staggerProps } from '../utils/animations';

const features = [
  {
    icon: TicketIcon, title: 'رزرو آسان و آنلاین',
    description: 'صندلی خود را در چند کلیک ساده و بدون نیاز به حضور فیزیکی رزرو کنید',
    iconBg: 'bg-brand-100', iconColor: 'text-brand-600',
  },
  {
    icon: EyeIcon, title: 'مشاهده لحظه‌ای وضعیت',
    description: 'نمایش گرافیکی و لحظه‌ای تمام صندلی‌های سالن با تفکیک رنگ',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
  },
  {
    icon: ChartBarIcon, title: 'مدیریت هوشمند',
    description: 'داشبورد مدیریتی کامل با گزارش‌های آماری و نمودارهای تحلیلی',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
  },
];

const perks = [
  { icon: ShieldCheckIcon, label: 'امن و قابل اعتماد' },
  { icon: DevicePhoneMobileIcon, label: 'واکنش‌گرا و موبایل‌پسند' },
  { icon: AcademicCapIcon, label: 'مخصوص دانشگاه بوعلی سینا' },
];

function AnimatedStat({ icon: Icon, value, label, delay = 0 }) {
  const [ref, isVisible] = useScrollReveal({ threshold: 0.3 });
  const [, count] = useCountUp(value, { duration: 1800, startOnView: true });

  return (
    <div ref={ref} className={`text-center p-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-3">
        <Icon className="w-7 h-7 text-accent-400" />
      </div>
      <p className="text-4xl font-extrabold text-white stat-counter mb-1">{isVisible ? count : 0}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ active_events: 0, total_seats: 0, total_users: 0 });

  useEffect(() => {
    if (isAuthenticated) { navigate(isAdmin ? '/admin/dashboard' : '/events'); return; }
    publicService.getStats().then(r => { if (r.success) setStats(r.data); }).catch(() => {});
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="page-shell bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.08),transparent_50%)]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-500/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-300/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm text-white/80 mb-8 border border-white/10 animate-float">
              <AcademicCapIcon className="w-4 h-4" />
              دانشکده مهندسی — دانشگاه بوعلی سینا
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-pretty">
              رزرو صندلی،
              <br />
              <span className="bg-gradient-to-l from-accent-400 via-amber-300 to-amber-200 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                آسان و هوشمند
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
              سامانه آنلاین رزرو صندلی سالن آمفی‌تئاتر دانشکده مهندسی. رویدادها را ببینید، صندلی خود را انتخاب کنید و بدون دغدغه در برنامه‌ها شرکت کنید.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register" className="btn-secondary !px-10 !py-3.5 !text-base !rounded-xl !shadow-lg hover:!shadow-xl !font-bold">
                شروع کنید
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-outline !border-white/30 !text-white hover:!bg-white/10 !px-10 !py-3.5 !text-base !rounded-xl !font-bold">
                ورود به سامانه
              </Link>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
              <AnimatedStat icon={CalendarDaysIcon} value={stats.active_events} label="رویداد فعال" delay={0} />
              <AnimatedStat icon={TicketIcon} value={stats.total_seats} label="صندلی" delay={200} />
              <AnimatedStat icon={UsersIcon} value={stats.total_users} label="کاربر" delay={400} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40C240 80 480 0 720 20C960 40 1200 80 1440 40V80H0V40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              چرا سامانه رزرو صندلی؟
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              تجربه‌ای نوین از مدیریت صندلی‌های سالن با امکانات کامل و رابط کاربری ساده
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <div key={f.title} className="card p-8 text-center group reveal" {...staggerProps(i, 100)}>
                <div className={`w-16 h-16 rounded-2xl ${f.iconBg} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-8 h-8 ${f.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Bar */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {perks.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-brand-700" />
                </div>
                <span className="text-sm font-semibold text-slate-600">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            همین حالا شروع کنید
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            ثبت‌نام کنید، رویدادهای فعال را مشاهده کنید و صندلی مورد نظر خود را رزرو کنید
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary !px-10 !py-3.5 !text-base !rounded-xl !font-bold">
              ساخت حساب کاربری
            </Link>
            <Link to="/login" className="btn-ghost !text-base !font-bold">
              قبلاً ثبت‌نام کرده‌اید؟
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
