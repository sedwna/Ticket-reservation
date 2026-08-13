import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon, MagnifyingGlassIcon, FunnelIcon,
  CalendarDaysIcon, ChartBarIcon, CheckCircleIcon, LightBulbIcon, TicketIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, LineChart, Line,
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

const PIE_COLORS = [
  '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#0ea5e9', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];
const EMPTY_FILTERS = { event_id: '', date_from: '', date_to: '' };
const RESERVATION_STATUS_META = {
  ACTIVE: { label: 'فعال', color: '#10b981', order: 0 },
  CANCELLED: { label: 'لغوشده', color: '#ef4444', order: 1 },
  COMPLETED: { label: 'تکمیل‌شده', color: '#3b82f6', order: 2 },
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
  const [trend, setTrend] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [evts, stats] = await Promise.all([
          eventService.getActiveEvents(),
          reservationService.getStats(),
        ]);
        if (evts.success) setEvents(evts.data || []);
        else setEvents(defaultData.events);
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
    const status = reservation.status || 'UNKNOWN';
    const meta = RESERVATION_STATUS_META[status] || {
      label: status === 'UNKNOWN' ? 'نامشخص' : status,
      color: '#94a3b8',
      order: 99,
    };
    result[status] = result[status] || {
      status,
      name: meta.label,
      color: meta.color,
      order: meta.order,
      value: 0,
    };
    result[status].value += 1;
    return result;
  }, {})).sort((first, second) => first.order - second.order);

  const barData = hasActiveFilters
    ? filteredEventData.map((item) => {
        const event = events.find((candidate) => candidate.title === item.name);
        return {
          ...item,
          capacity: event?.total_capacity || 0,
        };
      })
    : events.map((event) => {
        const reservedCount = Number(event.reserved_count) || 0;
        const capacity = Number(event.total_capacity) || 0;
        const availableCount = Number.isFinite(Number(event.available_count))
          ? Math.max(Number(event.available_count), 0)
          : Math.max(capacity - reservedCount, 0);
        const occupancyRate = Number.isFinite(Number(event.occupancy_rate))
          ? Math.min(Math.max(Number(event.occupancy_rate), 0), 100)
          : (capacity > 0 ? Math.min((reservedCount / capacity) * 100, 100) : 0);

        return {
          name: event.title,
          value: reservedCount,
          capacity,
          availableCount,
          occupancyRate,
        };
      });

  const eventColorByName = new Map(
    barData.map((item, index) => [item.name, PIE_COLORS[index % PIE_COLORS.length]]),
  );
  const sortedBarData = [...barData]
    .sort((first, second) => (
      (hasActiveFilters ? second.value - first.value : second.occupancyRate - first.occupancyRate)
      || second.value - first.value
      || first.name.localeCompare(second.name, 'fa')
    ))
    .map((item) => ({ ...item, color: eventColorByName.get(item.name) }));
  const totalBarReservations = sortedBarData.reduce((total, item) => total + item.value, 0);
  const maxBarValue = Math.max(...sortedBarData.map(item => item.value), 0);
  const totalEventCapacity = sortedBarData.reduce((total, item) => total + (item.capacity || 0), 0);
  const totalAvailableSeats = sortedBarData.reduce((total, item) => total + (item.availableCount || 0), 0);
  const overallOccupancyRate = totalEventCapacity > 0
    ? Math.min((totalBarReservations / totalEventCapacity) * 100, 100)
    : 0;
  const leadingEvent = sortedBarData[0];

  const pieData = filteredStatusData;
  const totalStatusReservations = pieData.reduce((total, item) => total + item.value, 0);
  const activeReservationCount = pieData.find((item) => item.status === 'ACTIVE')?.value || 0;
  const cancelledReservationCount = pieData.find((item) => item.status === 'CANCELLED')?.value || 0;
  const completedReservationCount = pieData.find((item) => item.status === 'COMPLETED')?.value || 0;
  const cancellationRate = totalStatusReservations > 0
    ? (cancelledReservationCount / totalStatusReservations) * 100
    : 0;

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
                        {hasActiveFilters ? 'رزروهای منطبق به تفکیک رویداد' : 'تحلیل نرخ پرشدگی رویدادها'}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">
                        {hasActiveFilters
                          ? 'مرتب‌شده بر اساس تعداد رزروهای منطبق با فیلتر؛ رنگ‌ها با نمودار سمت چپ یکسان‌اند.'
                          : 'مقایسه تعداد رزرو با ظرفیت واقعی؛ رویدادهای پُرتر در ابتدای فهرست قرار دارند.'}
                      </p>
                    </div>
                  </div>
                  {sortedBarData.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-medium text-ink-muted">
                        {sortedBarData.length.toLocaleString('fa-IR')} رویداد
                      </span>
                      <span className="rounded-full border border-brand-border bg-brand-soft px-2.5 py-1 font-bold text-brand-ink">
                        {totalBarReservations.toLocaleString('fa-IR')} {hasActiveFilters ? 'رزرو منطبق' : 'رزرو فعال'}
                      </span>
                    </div>
                  )}
                </div>

                {!hasActiveFilters && sortedBarData.length > 0 && (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-2.5">
                        <p className="text-[10px] font-medium text-ink-faint">پرشدگی کل</p>
                        <p className="mt-1 text-base font-extrabold text-ink-strong tabular-nums" dir="ltr">
                          {overallOccupancyRate.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
                        </p>
                      </div>
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-2.5">
                        <p className="text-[10px] font-medium text-ink-faint">صندلی باقی‌مانده</p>
                        <p className="mt-1 text-base font-extrabold text-ink-strong tabular-nums">
                          {totalAvailableSeats.toLocaleString('fa-IR')}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-line bg-surface-alt px-3 py-2.5 sm:col-span-1">
                        <p className="text-[10px] font-medium text-ink-faint">بیشترین تقاضا</p>
                        <p className="mt-1 truncate text-sm font-bold text-ink-strong" title={leadingEvent.name}>
                          {leadingEvent.name}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand-border bg-brand-soft px-3.5 py-3">
                      <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                      <p className="text-xs leading-5 text-brand-ink">
                        <strong>{leadingEvent.name}</strong> با نرخ پرشدگی{' '}
                        <strong>{leadingEvent.occupancyRate.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪</strong>{' '}
                        بیشترین تقاضا را دارد؛ در مجموع{' '}
                        <strong>{totalAvailableSeats.toLocaleString('fa-IR')} صندلی</strong> هنوز خالی است.
                      </p>
                    </div>
                  </>
                )}

                {sortedBarData.length > 0 ? (
                  <div className="space-y-2" role="list" aria-label={hasActiveFilters ? 'مقایسه تعداد رزرو رویدادها' : 'مقایسه نرخ پرشدگی رویدادها'}>
                    {sortedBarData.map((entry, index) => {
                      const relativeWidth = hasActiveFilters
                        ? (maxBarValue > 0 ? (entry.value / maxBarValue) * 100 : 0)
                        : entry.occupancyRate;
                      const share = totalBarReservations > 0 ? (entry.value / totalBarReservations) * 100 : 0;

                      return (
                        <div
                          key={entry.name}
                          role="listitem"
                          className="group rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-surface-alt/70"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 shrink-0 text-center text-[10px] font-bold text-ink-faint tabular-nums">
                              {(index + 1).toLocaleString('fa-IR')}
                            </span>
                            <span
                              aria-hidden="true"
                              className="h-3 w-3 shrink-0 rounded-md shadow-sm"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-ink">
                              {entry.name}
                            </span>
                            <span className="shrink-0 rounded-lg bg-surface-muted px-2 py-1 text-xs font-bold text-ink-strong tabular-nums">
                              {hasActiveFilters
                                ? `${entry.value.toLocaleString('fa-IR')} رزرو`
                                : `${entry.occupancyRate.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪`}
                            </span>
                          </div>

                          {!hasActiveFilters && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-[3.25rem] text-[11px] text-ink-faint">
                              <span>
                                <strong className="text-ink">{entry.value.toLocaleString('fa-IR')}</strong> رزرو از{' '}
                                <strong className="text-ink">{entry.capacity.toLocaleString('fa-IR')}</strong> صندلی
                              </span>
                              <span aria-hidden="true">•</span>
                              <span>
                                <strong className="text-ink">{entry.availableCount.toLocaleString('fa-IR')}</strong> صندلی خالی
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-3 pr-[3.25rem]">
                            <div
                              className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
                              role="progressbar"
                              aria-label={hasActiveFilters
                                ? `${entry.name}: ${entry.value} رزرو منطبق`
                                : `${entry.name}: ${entry.occupancyRate.toFixed(1)} درصد پرشدگی`}
                              aria-valuemin={0}
                              aria-valuemax={hasActiveFilters ? maxBarValue : 100}
                              aria-valuenow={hasActiveFilters ? entry.value : entry.occupancyRate}
                            >
                              <div
                                className="ml-auto h-full rounded-full transition-[width,filter] duration-700 ease-out group-hover:brightness-110"
                                style={{
                                  width: `${Math.max(relativeWidth, entry.value > 0 ? 3 : 0)}%`,
                                  backgroundColor: entry.color,
                                  boxShadow: `0 0 14px color-mix(in srgb, ${entry.color} 34%, transparent)`,
                                }}
                              />
                            </div>
                            <span className="w-12 shrink-0 text-left text-[11px] font-medium text-ink-faint tabular-nums" dir="ltr">
                              {hasActiveFilters
                                ? `${share.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪`
                                : `${entry.availableCount.toLocaleString('fa-IR')} خالی`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-ink-faint text-center py-24">داده‌ای برای نمایش وجود ندارد</p>
                )}
              </div>

              {/* Donut Chart + Legend */}
              <div className="card self-start p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink-strong">
                      {hasActiveFilters ? 'وضعیت رزروهای منطبق' : 'وضعیت کل رزروها'}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      ترکیب رزروهای فعال، لغوشده و تکمیل‌شده در نتایج فعلی
                    </p>
                  </div>
                  {totalStatusReservations > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-bold text-ink-strong">
                        {totalStatusReservations.toLocaleString('fa-IR')} رزرو
                      </span>
                      <span className="rounded-full border border-danger-border bg-danger-soft px-2.5 py-1 font-bold text-danger-ink">
                        {cancellationRate.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪ نرخ لغو
                      </span>
                    </div>
                  )}
                </div>
                {pieData.length > 0 ? (
                  <>
                    <div className="flex flex-col items-center gap-6 lg:flex-row">
                      {/* Donut */}
                      <div className="flex-shrink-0" style={{ width: 190, height: 190 }}>
                        <PieChart width={190} height={190}>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={56}
                            outerRadius={88}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.status} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, item) => [
                              `${Number(value).toLocaleString('fa-IR')} رزرو`,
                              item.payload?.name || name,
                            ]}
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                          />
                          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-ink-strong text-2xl font-extrabold">
                            {totalStatusReservations.toLocaleString('fa-IR')}
                          </text>
                          <text x="50%" y="59%" textAnchor="middle" dominantBaseline="central" className="fill-ink-faint text-[10px] font-medium">
                            کل رزروها
                          </text>
                        </PieChart>
                      </div>

                      {/* Legend */}
                      <div className="w-full min-w-0 flex-1 space-y-2">
                        {pieData.map((entry) => {
                          const percentage = totalStatusReservations > 0
                            ? (entry.value / totalStatusReservations) * 100
                            : 0;
                          return (
                            <div key={entry.status} className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-line hover:bg-surface-alt">
                              <div
                                className="h-3.5 w-3.5 flex-shrink-0 rounded-md shadow-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                                {entry.name}
                              </span>
                              <div className="ml-auto flex flex-shrink-0 items-center gap-2 text-sm">
                                <span className="font-bold text-ink-strong tabular-nums">
                                  {entry.value.toLocaleString('fa-IR')}
                                </span>
                                <span className="w-14 text-left text-xs font-medium text-ink-faint tabular-nums" dir="ltr">
                                  {percentage.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-border bg-brand-soft px-3.5 py-3">
                      <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                      <p className="text-xs leading-5 text-brand-ink">
                        {cancelledReservationCount > 0 ? (
                          <>
                            از مجموع <strong>{totalStatusReservations.toLocaleString('fa-IR')} رزرو</strong>،{' '}
                            <strong>{cancelledReservationCount.toLocaleString('fa-IR')} رزرو</strong> لغو شده و{' '}
                            <strong>{activeReservationCount.toLocaleString('fa-IR')} رزرو</strong> همچنان فعال است
                            {completedReservationCount > 0 && (
                              <>؛ <strong>{completedReservationCount.toLocaleString('fa-IR')} رزرو</strong> نیز تکمیل شده است</>
                            )}.
                          </>
                        ) : (
                          <>
                            در نتایج فعلی رزرو لغوشده‌ای وجود ندارد و <strong>{activeReservationCount.toLocaleString('fa-IR')} رزرو</strong> فعال است
                            {completedReservationCount > 0 && (
                              <>؛ <strong>{completedReservationCount.toLocaleString('fa-IR')} رزرو</strong> نیز تکمیل شده است</>
                            )}.
                          </>
                        )}
                      </p>
                    </div>
                  </>
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
