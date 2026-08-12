import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon, MagnifyingGlassIcon, XMarkIcon,
  CalendarDaysIcon, CheckCircleIcon, TicketIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import reservationService from '../../services/reservationService';
import eventService from '../../services/eventService';
import defaultData from '../../data/defaultData';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import {
  chartColors,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '../../utils/chartTheme';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#1A3C5E', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  // Filter state
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data state
  const [loading, setLoading] = useState(true);
  const [allReservations, setAllReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [eventReport, setEventReport] = useState(null);
  const [globalOccupancy, setGlobalOccupancy] = useState(null);
  const [trend, setTrend] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [evts, occ, stats] = await Promise.all([
          eventService.getActiveEvents(),
          reservationService.getOccupancyData(),
          reservationService.getStats(),
        ]);
        if (evts.success) setEvents(evts.data || []);
        else setEvents(defaultData.events);
        if (occ.success) setGlobalOccupancy(occ.data);
        else setGlobalOccupancy(defaultData.occupancyData);
        if (stats.success) setTrend(stats.data?.reservation_trend || []);
        else setTrend(defaultData.stats.reservation_trend);

        // Load all reservations
        const allRes = await reservationService.getAll();
        if (allRes.success) {
          setAllReservations(allRes.data || []);
          setFilteredReservations(allRes.data || []);
        } else {
          const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
          setAllReservations(fallbackReservations);
          setFilteredReservations(fallbackReservations);
        }
      } catch {
        const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
        setEvents(defaultData.events);
        setGlobalOccupancy(defaultData.occupancyData);
        setTrend(defaultData.stats.reservation_trend);
        setAllReservations(fallbackReservations);
        setFilteredReservations(fallbackReservations);
      } finally { setLoading(false); }
    };
    init();
  }, []);

  // Apply filters — refetch from API or filter locally
  const applyFilters = useCallback(async () => {
    setRefreshing(true);
    try {
      const filters = {};
      if (eventFilter) filters.event_id = eventFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const res = await reservationService.getAll(filters);
      if (res.success) setFilteredReservations(res.data || []);

      // If specific event selected, fetch event report
      if (eventFilter) {
        const report = await reservationService.getEventReport(eventFilter);
        if (report.success) setEventReport(report.data);
      } else {
        setEventReport(null);
      }
    } catch { toast.error('خطا در دریافت داده‌ها'); }
    finally { setRefreshing(false); }
  }, [eventFilter, dateFrom, dateTo]);

  // Auto-refetch when event filter changes
  useEffect(() => {
    if (loading) return undefined;

    const timeoutId = window.setTimeout(applyFilters, 0);
    return () => window.clearTimeout(timeoutId);
  }, [eventFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyClick = () => applyFilters();

  const handleClearFilters = () => {
    setEventFilter('');
    setDateFrom('');
    setDateTo('');
    // Reset to all
    setFilteredReservations(allReservations);
    setEventReport(null);
  };

  const handleExport = async () => {
    try {
      const filters = {};
      if (eventFilter) filters.event_id = eventFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const blob = await reservationService.exportCSV(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('گزارش CSV دانلود شد');
    } catch { toast.error('خطا در خروجی CSV'); }
  };

  const hasActiveFilters = eventFilter || dateFrom || dateTo;

  // ── Chart Data ──

  // Bar chart: if event selected → show reserved vs available for that event
  //             else → show global occupancy per event
  const barData = eventReport ? [
    { name: 'رزرو شده', value: eventReport.reserved_count },
    { name: 'آزاد', value: eventReport.available_count },
  ] : (globalOccupancy ? globalOccupancy.labels.map((l, i) => ({
    name: l,
    value: globalOccupancy.data[i] || 0,
  })) : []);

  // Pie chart: same logic — event-specific or global
  const pieData = eventReport ? [
    { name: 'رزرو شده', value: eventReport.reserved_count },
    { name: 'آزاد', value: eventReport.available_count },
  ] : (globalOccupancy ? globalOccupancy.labels.map((l, i) => ({
    name: l,
    value: globalOccupancy.data[i] || 0,
  })) : []);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-ink-strong">گزارش‌ها</h2>
            <p className="text-ink-muted mt-1">آمار و تحلیل رزروهای سامانه</p>
          </div>
          <Button onClick={handleExport} variant="primary" size="md">
            <ArrowDownTrayIcon className="w-5 h-5" /> دانلود CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-surface-card rounded-2xl border border-line p-4 sm:p-5 mb-8">
          <div className="grid sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">رویداد</label>
              <select
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
                className="input-field"
              >
                <option value="">همه رویدادها</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">از تاریخ</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="input-field ltr text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">تا تاریخ</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="input-field ltr text-left" dir="ltr" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleApplyClick} disabled={refreshing} variant="primary" size="sm" fullWidth>
                <MagnifyingGlassIcon className="w-4 h-4" />
                {refreshing ? 'در حال جستجو...' : 'اعمال فیلتر'}
              </Button>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} variant="ghost" size="sm" className="!px-3" title="پاک کردن فیلترها">
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active filter indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-line">
              <span className="text-xs text-ink-faint">فیلترهای فعال:</span>
              {eventFilter && (
                <span className="inline-flex items-center gap-1 text-xs bg-brand-soft text-brand-ink px-2.5 py-1 rounded-full">
                  رویداد: {events.find(e => e.id === eventFilter)?.title || '...'}
                </span>
              )}
              {dateFrom && (
                <span className="inline-flex items-center gap-1 text-xs bg-warning-soft text-warning-ink px-2.5 py-1 rounded-full">
                  از: {dateFrom}
                </span>
              )}
              {dateTo && (
                <span className="inline-flex items-center gap-1 text-xs bg-warning-soft text-warning-ink px-2.5 py-1 rounded-full">
                  تا: {dateTo}
                </span>
              )}
              <span className="text-xs text-ink-faint mr-auto">
                {filteredReservations.length} نتیجه
              </span>
            </div>
          )}
        </div>

        {loading ? <TableSkeleton rows={4} cols={4} /> : (
          <>
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-ink-strong mb-6">
                  {eventReport
                    ? `رزروهای: ${eventReport.event_title}`
                    : 'مقایسه رزروها به تفکیک رویداد'}
                </h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                      <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={chartColors.axis} fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                      <Bar dataKey="value" fill={chartColors.primary} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-ink-faint text-center py-24">داده‌ای برای نمایش وجود ندارد</p>
                )}
              </div>

              {/* Donut Chart + Legend */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-ink-strong mb-4">
                  {eventReport
                    ? `وضعیت ظرفیت: ${eventReport.event_title}`
                    : 'توزیع رزروها'}
                </h3>
                {pieData.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    {/* Donut */}
                    <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
                      <PieChart width={180} height={180}>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                          />
                        </PieChart>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      {pieData.map((entry, i) => {
                        const total = pieData.reduce((s, d) => s + d.value, 0);
                        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                        const color = PIE_COLORS[i % PIE_COLORS.length];
                        return (
                          <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface-alt transition-colors">
                            {/* Color swatch */}
                            <div
                              className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {/* Label — allow full text wrapping */}
                            <span className="flex-1 text-sm font-medium text-ink leading-relaxed min-w-0">
                              {entry.name}
                            </span>
                            {/* Count + percentage */}
                            <div className="flex items-center gap-2 flex-shrink-0 text-sm ml-auto">
                              <span className="font-bold text-ink-strong stat-counter tabular-nums">
                                {entry.value}
                              </span>
                              <span className="text-xs text-ink-faint font-medium tabular-nums w-12 text-left ltr" dir="ltr">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-ink-faint text-center py-24">داده‌ای برای نمایش وجود ندارد</p>
                )}
              </div>
            </div>

            {/* Event Report Summary */}
            {eventReport && (
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-ink-strong">{eventReport.total_capacity}</p>
                    <p className="text-xs text-ink-muted">ظرفیت کل</p>
                  </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success-soft flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-success-ink" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-ink-strong">{eventReport.reserved_count}</p>
                    <p className="text-xs text-ink-muted">رزرو شده</p>
                  </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning-soft flex items-center justify-center">
                    <TicketIcon className="w-6 h-6 text-warning-ink" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-ink-strong">{eventReport.available_count}</p>
                    <p className="text-xs text-ink-muted">صندلی آزاد</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trend */}
            {!eventReport && trend.length > 0 && (
              <div className="card p-6 mb-8">
                <h3 className="text-lg font-bold text-ink-strong mb-6">روند رزروها (۷ روز)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartColors.axis} fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                    <Line type="monotone" dataKey="count" stroke={chartColors.success} strokeWidth={2.5}
                      dot={{ fill: chartColors.success, r: 4, strokeWidth: 2, stroke: chartColors.dotStroke }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Table */}
            <div className="card overflow-x-auto">
              <h3 className="text-lg font-bold text-ink-strong p-6 pb-4">
                جزئیات رزروها
                {eventReport && <span className="text-sm font-normal text-ink-faint mr-2">— {eventReport.event_title}</span>}
              </h3>
              {filteredReservations.length === 0 ? (
                <p className="text-ink-faint text-center py-16">
                  {hasActiveFilters ? 'رزروی با فیلترهای انتخاب شده یافت نشد' : 'رزروی برای نمایش وجود ندارد'}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">کاربر</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">ش. دانشجویی</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">رویداد</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">صندلی</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">تاریخ</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r, i) => (
                      <tr key={r.id || i} className="border-b border-line/60 hover:bg-surface-alt/70 transition-colors">
                        <td className="py-3 px-4 text-ink-strong">{r.user_full_name || '—'}</td>
                        <td className="py-3 px-4 text-ink-muted ltr text-left" dir="ltr">{r.user_student_id || '—'}</td>
                        <td className="py-3 px-4 text-ink">{r.event_title || '—'}</td>
                        <td className="py-3 px-4 font-medium text-ink">{r.seat_label || '—'}</td>
                        <td className="py-3 px-4 text-ink-faint text-xs">{new Date(r.reserved_at).toLocaleDateString('fa-IR')}</td>
                        <td className="py-3 px-4"><Badge status={r.status} size="xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
