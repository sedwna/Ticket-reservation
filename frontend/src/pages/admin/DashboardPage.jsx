import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon, TicketIcon, UsersIcon, ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import reservationService from '../../services/reservationService';
import defaultData from '../../data/defaultData';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import { StatCardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  chartColors,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '../../utils/chartTheme';

const statCards = [
  { key: 'active_events', label: 'رویدادهای فعال', icon: CalendarDaysIcon, color: 'bg-brand-soft text-brand-accent' },
  { key: 'today_reservations', label: 'رزروهای امروز', icon: TicketIcon, color: 'bg-success-soft text-success-ink' },
  { key: 'total_users', label: 'کاربران', icon: UsersIcon, color: 'bg-violet-soft text-violet-ink' },
  { key: 'weekly_events', label: 'رویدادهای هفته', icon: ChartBarIcon, color: 'bg-warning-soft text-warning-ink' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const r = await reservationService.getStats();
      if (r.success) setStats(r.data);
      else setStats(defaultData.stats);
    } catch {
      setStats(defaultData.stats);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchStats, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-ink-strong mb-8">داشبورد مدیریت</h2>

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
                  <p className="text-3xl font-extrabold text-ink-strong">{stats?.[card.key] || 0}</p>
                  <p className="text-sm text-ink-muted">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-ink-strong mb-6">روند رزروها (۷ روز اخیر)</h3>
            {stats?.reservation_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.reservation_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartColors.axis} fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                  />
                  <Line type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2.5}
                    dot={{ fill: chartColors.accent, r: 5, strokeWidth: 2, stroke: chartColors.dotStroke }}
                    activeDot={{ r: 7, fill: chartColors.accent, strokeWidth: 3, stroke: chartColors.dotStroke }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ink-faint text-center py-20">داده‌ای برای نمایش وجود ندارد</p>
            )}
          </div>

          {/* Recent Reservations */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-ink-strong mb-4">آخرین رزروها</h3>
            {stats?.recent_reservations?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_reservations.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-bold text-ink-faint flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-ink-strong truncate">{r.user_full_name || '—'}</p>
                        <p className="text-xs text-ink-faint truncate">{r.event_title} • {r.seat_label}</p>
                      </div>
                    </div>
                    <Badge status={r.status} size="xs" className="flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-faint text-center py-20">هنوز رزروی ثبت نشده</p>
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
            <Link key={link.to} to={link.to} className="card p-5 group hover:border-brand-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center group-hover:bg-brand-soft transition-colors">
                <link.icon className="w-6 h-6 text-ink-faint group-hover:text-brand-accent transition-colors" />
              </div>
              <div>
                <p className="font-bold text-ink-strong group-hover:text-brand-ink transition-colors">{link.label}</p>
                <p className="text-xs text-ink-faint">{link.desc}</p>
              </div>
              <ArrowLeftIcon className="w-4 h-4 text-ink-subtle group-hover:text-brand-accent mr-auto transition-all group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
