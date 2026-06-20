import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon, TicketIcon, UsersIcon, ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import reservationService from '../../services/reservationService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import { StatCardSkeleton } from '../../components/common/LoadingSkeleton';

const statCards = [
  { key: 'active_events', label: 'رویدادهای فعال', icon: CalendarDaysIcon, color: 'bg-brand-50 text-brand-600' },
  { key: 'today_reservations', label: 'رزروهای امروز', icon: TicketIcon, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'total_users', label: 'کاربران', icon: UsersIcon, color: 'bg-violet-50 text-violet-600' },
  { key: 'weekly_events', label: 'رویدادهای هفته', icon: ChartBarIcon, color: 'bg-amber-50 text-amber-600' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const r = await reservationService.getStats();
      if (r.success) setStats(r.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8">داشبورد مدیریت</h2>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.key} className="card p-5 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats?.[card.key] || 0}</p>
                  <p className="text-sm text-slate-500">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">📈 روند رزروها (۷ روز اخیر)</h3>
            {stats?.reservation_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.reservation_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#1A3C5E" strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#f59e0b', strokeWidth: 3, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-20">داده‌ای برای نمایش وجود ندارد</p>
            )}
          </div>

          {/* Recent Reservations */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🕐 آخرین رزروها</h3>
            {stats?.recent_reservations?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_reservations.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{r.user_full_name || '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{r.event_title} • {r.seat_label}</p>
                      </div>
                    </div>
                    <Badge status={r.status} size="xs" className="flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-20">هنوز رزروی ثبت نشده</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { to: '/admin/events', icon: CalendarDaysIcon, label: 'مدیریت رویدادها', desc: 'ایجاد و ویرایش رویدادها' },
            { to: '/admin/users', icon: UsersIcon, label: 'مدیریت کاربران', desc: 'مشاهده و مدیریت کاربران' },
            { to: '/admin/reports', icon: ChartBarIcon, label: 'گزارش‌ها', desc: 'نمودارها و خروجی CSV' },
          ].map(link => (
            <Link key={link.to} to={link.to} className="card p-5 group hover:border-brand-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                <link.icon className="w-6 h-6 text-slate-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{link.label}</p>
                <p className="text-xs text-slate-400">{link.desc}</p>
              </div>
              <ArrowLeftIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-500 mr-auto transition-all group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
