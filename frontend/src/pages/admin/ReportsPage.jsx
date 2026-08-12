import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon, MagnifyingGlassIcon, FunnelIcon,
  CalendarDaysIcon, ChartBarIcon, CheckCircleIcon, TicketIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, LabelList, PieChart, Pie, Cell, LineChart, Line,
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
const EMPTY_FILTERS = { event_id: '', date_from: '', date_to: '' };
const STATUS_LABELS = {
  ACTIVE: 'فعال',
  CANCELLED: 'لغوشده',
  COMPLETED: 'تکمیل‌شده',
};

const formatFilterDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const splitChartLabel = (label, maxLineLength = 25) => {
  const words = String(label || '').trim().split(/\s+/);
  const lines = [];

  words.forEach((word) => {
    const currentLine = lines.at(-1);
    if (!currentLine || `${currentLine} ${word}`.length > maxLineLength) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    }
  });

  if (lines.length <= 2) return lines;
  return [lines[0], `${lines.slice(1).join(' ').slice(0, maxLineLength - 1).trim()}…`];
};

function EventAxisTick({ x, y, payload }) {
  const lines = splitChartLabel(payload?.value);
  const firstLineOffset = lines.length > 1 ? -7 : 4;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={firstLineOffset}
        textAnchor="end"
        fill={chartColors.axis}
        fontSize={11.5}
        fontFamily="Vazirmatn, Tahoma, sans-serif"
        direction="rtl"
      >
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={-10} dy={index === 0 ? 0 : 16}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export default function ReportsPage() {
  // Filter state
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  // Data state
  const [loading, setLoading] = useState(true);
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
          setFilteredReservations(allRes.data || []);
        } else {
          const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
          setFilteredReservations(fallbackReservations);
        }
      } catch {
        const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
        setEvents(defaultData.events);
        setGlobalOccupancy(defaultData.occupancyData);
        setTrend(defaultData.stats.reservation_trend);
        setFilteredReservations(fallbackReservations);
      } finally { setLoading(false); }
    };
    init();
  }, []);

  // Apply filters — refetch from API or filter locally
  const applyFilters = useCallback(async (filtersOverride) => {
    const nextFilters = filtersOverride || {
      event_id: eventFilter,
      date_from: dateFrom,
      date_to: dateTo,
    };

    if (nextFilters.date_from && nextFilters.date_to && nextFilters.date_from > nextFilters.date_to) {
      toast.error('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد');
      return;
    }

    setRefreshing(true);
    try {
      const filters = {};
      if (nextFilters.event_id) filters.event_id = nextFilters.event_id;
      if (nextFilters.date_from) filters.date_from = nextFilters.date_from;
      if (nextFilters.date_to) filters.date_to = nextFilters.date_to;

      const res = await reservationService.getAll(filters);
      if (!res.success) throw new Error('Failed to filter reservations');

      setFilteredReservations(res.data || []);
      setAppliedFilters(nextFilters);

      // If specific event selected, fetch event report
      if (nextFilters.event_id) {
        const report = await reservationService.getEventReport(nextFilters.event_id);
        if (report.success) setEventReport(report.data);
      } else {
        setEventReport(null);
      }
    } catch { toast.error('خطا در دریافت داده‌ها'); }
    finally { setRefreshing(false); }
  }, [eventFilter, dateFrom, dateTo]);

  const handleApplyClick = () => applyFilters();

  const handleClearFilters = async () => {
    setEventFilter('');
    setDateFrom('');
    setDateTo('');
    await applyFilters(EMPTY_FILTERS);
  };

  const handleExport = async () => {
    try {
      const filters = {};
      if (appliedFilters.event_id) filters.event_id = appliedFilters.event_id;
      if (appliedFilters.date_from) filters.date_from = appliedFilters.date_from;
      if (appliedFilters.date_to) filters.date_to = appliedFilters.date_to;

      const blob = await reservationService.exportCSV(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('گزارش CSV دانلود شد');
    } catch { toast.error('خطا در خروجی CSV'); }
  };

  const hasActiveFilters = Boolean(appliedFilters.event_id || appliedFilters.date_from || appliedFilters.date_to);
  const hasPendingChanges = eventFilter !== appliedFilters.event_id
    || dateFrom !== appliedFilters.date_from
    || dateTo !== appliedFilters.date_to;
  const appliedEventTitle = events.find(event => event.id === appliedFilters.event_id)?.title;

  // ── Chart Data ──

  // Applied filters drive every visualization; draft values do not affect the report.
  const filteredEventData = Object.values(filteredReservations.reduce((result, reservation) => {
    const name = reservation.event_title || 'رویداد نامشخص';
    result[name] = result[name] || { name, value: 0 };
    result[name].value += 1;
    return result;
  }, {}));

  const filteredStatusData = Object.values(filteredReservations.reduce((result, reservation) => {
    const name = STATUS_LABELS[reservation.status] || reservation.status || 'نامشخص';
    result[name] = result[name] || { name, value: 0 };
    result[name].value += 1;
    return result;
  }, {}));

  const barData = hasActiveFilters
    ? filteredEventData
    : (globalOccupancy ? globalOccupancy.labels.map((l, i) => ({
        name: l,
        value: globalOccupancy.data[i] || 0,
      })) : []);

  const sortedBarData = [...barData].sort((first, second) => (
    second.value - first.value || first.name.localeCompare(second.name, 'fa')
  ));
  const barChartHeight = Math.max(340, (sortedBarData.length * 46) + 48);
  const totalBarReservations = sortedBarData.reduce((total, item) => total + item.value, 0);

  const pieData = hasActiveFilters
    ? filteredStatusData
    : (globalOccupancy ? globalOccupancy.labels.map((l, i) => ({
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-soft">
                <FunnelIcon className="h-5 w-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="font-bold text-ink-strong">فیلتر گزارش</h3>
                <p className="mt-0.5 text-xs text-ink-muted">ابتدا معیارها را انتخاب کنید، سپس «نمایش نتایج» را بزنید.</p>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="self-start !text-danger-ink sm:self-auto"
              >
                <XMarkIcon className="h-4 w-4" />
                پاک کردن همه فیلترها
              </Button>
            )}
          </div>

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
            <div>
              <Button onClick={handleApplyClick} disabled={refreshing} variant="primary" size="sm" fullWidth>
                <MagnifyingGlassIcon className="w-4 h-4" />
                {refreshing ? 'در حال به‌روزرسانی...' : hasPendingChanges ? 'نمایش نتایج' : 'به‌روزرسانی گزارش'}
              </Button>
            </div>
          </div>

          {hasPendingChanges && (
            <div role="status" className="mt-4 rounded-xl border border-warning-border bg-warning-soft px-4 py-2.5 text-xs text-warning-ink">
              تغییرات جدید هنوز اعمال نشده‌اند؛ برای به‌روزرسانی نمودارها و جدول، دکمه «نمایش نتایج» را بزنید.
            </div>
          )}

          {/* Applied filter summary */}
          <div className={`mt-4 rounded-xl border px-4 py-3 ${hasActiveFilters ? 'border-success-border bg-success-soft' : 'border-line bg-surface-alt'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircleIcon className={`mt-0.5 h-5 w-5 shrink-0 ${hasActiveFilters ? 'text-success-ink' : 'text-ink-faint'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${hasActiveFilters ? 'text-success-ink' : 'text-ink'}`}>
                    {hasActiveFilters ? 'فیلتر با موفقیت اعمال شده است' : 'در حال نمایش همه رزروها'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    {hasActiveFilters
                      ? 'نمودارها، جدول جزئیات و خروجی CSV بر اساس فیلترهای زیر نمایش داده می‌شوند.'
                      : 'هیچ محدودیتی روی رویداد یا تاریخ رزرو اعمال نشده است.'}
                  </p>
                </div>
              </div>
              <span className="sm:mr-auto inline-flex w-fit items-center rounded-full border border-line-strong bg-surface-card px-3 py-1 text-xs font-bold text-ink-strong tabular-nums">
                {filteredReservations.length.toLocaleString('fa-IR')} نتیجه
              </span>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-success-border/60 pt-3">
                {appliedFilters.event_id && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs font-medium text-brand-ink">
                    رویداد: {appliedEventTitle || 'رویداد انتخاب‌شده'}
                  </span>
                )}
                {appliedFilters.date_from && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-medium text-warning-ink">
                    از {formatFilterDate(appliedFilters.date_from)}
                  </span>
                )}
                {appliedFilters.date_to && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-medium text-warning-ink">
                    تا پایان {formatFilterDate(appliedFilters.date_to)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? <TableSkeleton rows={4} cols={4} /> : (
          <>
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <div className="card p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-soft">
                      <ChartBarIcon className="h-5 w-5 text-brand-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-ink-strong">
                        {hasActiveFilters ? 'رزروهای منطبق به تفکیک رویداد' : 'مقایسه رزروها به تفکیک رویداد'}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">
                        رویدادها بر اساس تعداد رزرو مرتب شده‌اند؛ برای جزئیات روی هر میله مکث کنید.
                      </p>
                    </div>
                  </div>
                  {sortedBarData.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-medium text-ink-muted">
                        {sortedBarData.length.toLocaleString('fa-IR')} رویداد
                      </span>
                      <span className="rounded-full border border-brand-border bg-brand-soft px-2.5 py-1 font-bold text-brand-ink">
                        {totalBarReservations.toLocaleString('fa-IR')} رزرو
                      </span>
                    </div>
                  )}
                </div>

                {sortedBarData.length > 0 ? (
                  <div className="-mx-2 overflow-x-auto pb-2" dir="ltr">
                    <div className="min-w-[540px] px-2" style={{ height: barChartHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={sortedBarData}
                          layout="vertical"
                          margin={{ top: 6, right: 50, bottom: 6, left: 8 }}
                          barCategoryGap="24%"
                          accessibilityLayer
                        >
                          <defs>
                            <linearGradient id="reportBarGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.72} />
                              <stop offset="100%" stopColor={chartColors.accent} stopOpacity={0.96} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="4 5"
                            stroke={chartColors.grid}
                            horizontal={false}
                            vertical
                          />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: chartColors.axis, fontSize: 11 }}
                            tickFormatter={(value) => Number(value).toLocaleString('fa-IR')}
                            domain={[0, (dataMax) => Math.max(1, Math.ceil(dataMax * 1.22))]}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={190}
                            interval={0}
                            tickLine={false}
                            axisLine={false}
                            tick={<EventAxisTick />}
                          />
                          <Tooltip
                            cursor={{ fill: 'var(--color-brand-soft)', opacity: 0.45 }}
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                            wrapperStyle={{ direction: 'rtl' }}
                            formatter={(value) => [`${Number(value).toLocaleString('fa-IR')} رزرو`, 'تعداد']}
                          />
                          <Bar
                            dataKey="value"
                            name="تعداد رزرو"
                            fill="url(#reportBarGradient)"
                            radius={[0, 8, 8, 0]}
                            minPointSize={6}
                            maxBarSize={26}
                            background={{ fill: 'var(--color-surface-muted)', opacity: 0.52, radius: 8 }}
                            activeBar={{ fill: chartColors.accent, opacity: 1 }}
                            animationDuration={750}
                            animationEasing="ease-out"
                          >
                            <LabelList
                              dataKey="value"
                              position="right"
                              fill="var(--color-ink-strong)"
                              fontSize={11.5}
                              fontWeight={700}
                              formatter={(value) => Number(value).toLocaleString('fa-IR')}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="text-ink-faint text-center py-24">داده‌ای برای نمایش وجود ندارد</p>
                )}
              </div>

              {/* Donut Chart + Legend */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-ink-strong mb-4">
                  {hasActiveFilters ? 'وضعیت رزروهای منطبق' : 'توزیع رزروها'}
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
            {!hasActiveFilters && trend.length > 0 && (
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
