import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon, MagnifyingGlassIcon, FunnelIcon,
  ChartBarIcon, CheckCircleIcon, CheckIcon, ChevronDownIcon,
  LightBulbIcon, XMarkIcon,
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
const createEmptyFilters = () => ({ event_ids: [], date_from: '', date_to: '' });
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

const formatChartDate = (value) => {
  if (!value) return 'تاریخ نامشخص';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const haveSameEventIDs = (first = [], second = []) => (
  first.length === second.length && first.every((id) => second.includes(id))
);

const normalizeIdentifier = (value) => String(value ?? '').trim().toLowerCase();

const filterReservationsLocally = (
  reservations = [],
  filters = createEmptyFilters(),
  events = [],
) => {
  const selectedEventIDs = new Set(filters.event_ids.map(normalizeIdentifier));
  const selectedEventTitles = new Set(
    events
      .filter((event) => selectedEventIDs.has(normalizeIdentifier(event.id)))
      .map((event) => normalizeIdentifier(event.title)),
  );

  return reservations.filter((reservation) => {
    const reservationEventID = normalizeIdentifier(reservation.event_id ?? reservation.event?.id);
    const reservationEventTitle = normalizeIdentifier(reservation.event_title ?? reservation.event?.title);
    if (
      selectedEventIDs.size > 0
      && !selectedEventIDs.has(reservationEventID)
      && !selectedEventTitles.has(reservationEventTitle)
    ) {
      return false;
    }

    const reservationDate = String(reservation.reserved_at || reservation.created_at || '').slice(0, 10);
    if (filters.date_from && (!reservationDate || reservationDate < filters.date_from)) {
      return false;
    }
    if (filters.date_to && (!reservationDate || reservationDate > filters.date_to)) {
      return false;
    }

    return true;
  });
};

export default function ReportsPage() {
  // Filter state
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState([]);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters);
  const eventMenuRef = useRef(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [allReservations, setAllReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [trend, setTrend] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [evts, stats] = await Promise.all([
          eventService.getAdminEvents(),
          reservationService.getStats(),
        ]);
        if (evts.success) setEvents(evts.data || []);
        else setEvents(defaultData.events);
        if (stats.success) setTrend(stats.data?.reservation_trend || []);
        else setTrend(defaultData.stats.reservation_trend);

        // Load all reservations
        const allRes = await reservationService.getAll();
        if (allRes.success) {
          const reservations = allRes.data || [];
          setAllReservations(reservations);
          setFilteredReservations(reservations);
        } else {
          const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
          setAllReservations(fallbackReservations);
          setFilteredReservations(fallbackReservations);
        }
      } catch {
        const fallbackReservations = [...defaultData.reservations.active, ...defaultData.reservations.history];
        setEvents(defaultData.events);
        setTrend(defaultData.stats.reservation_trend);
        setAllReservations(fallbackReservations);
        setFilteredReservations(fallbackReservations);
      } finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!eventMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!eventMenuRef.current?.contains(event.target)) setEventMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setEventMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [eventMenuOpen]);

  // Apply filters — refetch from API or filter locally
  const applyFilters = useCallback(async (filtersOverride) => {
    const nextFilters = filtersOverride || {
      event_ids: [...eventFilter],
      date_from: dateFrom,
      date_to: dateTo,
    };

    if (nextFilters.date_from && nextFilters.date_to && nextFilters.date_from > nextFilters.date_to) {
      toast.error('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد');
      return;
    }

    setRefreshing(true);
    try {
      // Always fetch the complete source and apply one shared client-side filter.
      // This keeps the table and both charts consistent even with an older backend.
      const res = await reservationService.getAll();
      if (!res.success) throw new Error('Failed to filter reservations');

      const responseReservations = res.data || [];
      const verifiedReservations = filterReservationsLocally(responseReservations, nextFilters, events);
      setAllReservations(responseReservations);
      setFilteredReservations(verifiedReservations);
      setAppliedFilters({ ...nextFilters, event_ids: [...nextFilters.event_ids] });
      toast.success(
        `${verifiedReservations.length.toLocaleString('fa-IR')} از ${responseReservations.length.toLocaleString('fa-IR')} رزرو نمایش داده می‌شود`,
      );
    } catch { toast.error('خطا در دریافت داده‌ها'); }
    finally { setRefreshing(false); }
  }, [eventFilter, dateFrom, dateTo, events]);

  const handleApplyClick = () => applyFilters();

  const handleClearFilters = async () => {
    setEventFilter([]);
    setEventSearch('');
    setEventMenuOpen(false);
    setDateFrom('');
    setDateTo('');
    await applyFilters(createEmptyFilters());
  };

  const handleExport = async () => {
    try {
      const filters = {};
      if (appliedFilters.event_ids.length > 0) filters.event_ids = appliedFilters.event_ids.join(',');
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

  const hasActiveFilters = Boolean(appliedFilters.event_ids.length || appliedFilters.date_from || appliedFilters.date_to);
  const hasPendingChanges = !haveSameEventIDs(eventFilter, appliedFilters.event_ids)
    || dateFrom !== appliedFilters.date_from
    || dateTo !== appliedFilters.date_to;
  const appliedEvents = events.filter((event) => appliedFilters.event_ids.includes(event.id));
  const draftEvents = events.filter((event) => eventFilter.includes(event.id));
  const visibleEventOptions = events.filter((event) => (
    event.title.toLocaleLowerCase('fa').includes(eventSearch.trim().toLocaleLowerCase('fa'))
  ));

  const toggleEventFilter = (eventID) => {
    setEventFilter((current) => (
      current.includes(eventID)
        ? current.filter((id) => id !== eventID)
        : [...current, eventID]
    ));
  };

  // ── Chart Data ──

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

  const matchingReservationStats = filteredReservations.reduce((result, reservation) => {
    const eventID = normalizeIdentifier(reservation.event_id ?? reservation.event?.id);
    const eventTitle = normalizeIdentifier(reservation.event_title ?? reservation.event?.title);
    const eventKey = eventID || (eventTitle ? `title:${eventTitle}` : '');
    if (!eventKey) return result;
    const status = reservation.status || 'UNKNOWN';
    result[eventKey] = result[eventKey] || {
      total: 0,
      active: 0,
      cancelled: 0,
      completed: 0,
      unknown: 0,
    };
    result[eventKey].total += 1;
    if (status === 'ACTIVE') result[eventKey].active += 1;
    else if (status === 'CANCELLED') result[eventKey].cancelled += 1;
    else if (status === 'COMPLETED') result[eventKey].completed += 1;
    else result[eventKey].unknown += 1;
    return result;
  }, {});

  const chartEvents = appliedEvents.length > 0
    ? appliedEvents
    : events.filter((event) => {
      const idKey = normalizeIdentifier(event.id);
      const titleKey = `title:${normalizeIdentifier(event.title)}`;
      return (matchingReservationStats[idKey]?.total || matchingReservationStats[titleKey]?.total || 0) > 0;
    });
  const barData = chartEvents.map((event) => {
    const reservedCount = Number(event.reserved_count) || 0;
    const capacity = Number(event.total_capacity) || 0;
    const availableCount = Number.isFinite(Number(event.available_count))
      ? Math.max(Number(event.available_count), 0)
      : Math.max(capacity - reservedCount, 0);
    const matches = matchingReservationStats[normalizeIdentifier(event.id)]
      || matchingReservationStats[`title:${normalizeIdentifier(event.title)}`] || {
      total: 0,
      active: 0,
      cancelled: 0,
      completed: 0,
      unknown: 0,
    };

    return {
      id: event.id,
      name: event.title,
      value: reservedCount,
      capacity,
      availableCount,
      matchingCount: matches.total,
      matchingActive: matches.active,
      matchingCancelled: matches.cancelled,
      matchingCompleted: matches.completed,
      matchingUnknown: matches.unknown,
      status: event.status,
    };
  });

  const eventColorByName = new Map(
    barData.map((item, index) => [item.name, PIE_COLORS[index % PIE_COLORS.length]]),
  );
  const sortedBarData = [...barData]
    .sort((first, second) => (
      second.matchingCount - first.matchingCount
      || second.matchingActive - first.matchingActive
      || second.value - first.value
      || first.name.localeCompare(second.name, 'fa')
    ))
    .map((item) => ({ ...item, color: eventColorByName.get(item.name) }));
  const totalMatchingReservations = sortedBarData.reduce((total, item) => total + item.matchingCount, 0);
  const maxMatchingReservations = Math.max(...sortedBarData.map((item) => item.matchingCount), 0);
  const leadingEvent = sortedBarData[0];
  const selectedEventCount = appliedFilters.event_ids.length;
  const singleSelectedEvent = selectedEventCount === 1 ? sortedBarData[0] : null;

  const dailyTrendData = Object.values(filteredReservations.reduce((result, reservation) => {
    const date = String(reservation.reserved_at || reservation.created_at || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return result;

    result[date] = result[date] || {
      date,
      label: formatChartDate(date),
      count: 0,
    };
    result[date].count += 1;
    return result;
  }, {})).sort((first, second) => first.date.localeCompare(second.date));
  const busiestDay = dailyTrendData.reduce((current, item) => (
    !current || item.count > current.count ? item : current
  ), null);
  const averageDailyReservations = dailyTrendData.length > 0
    ? totalMatchingReservations / dailyTrendData.length
    : 0;

  const pieData = filteredStatusData;
  const totalStatusReservations = pieData.reduce((total, item) => total + item.value, 0);
  const totalReservationCount = Math.max(allReservations.length, totalStatusReservations);
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
            <div ref={eventMenuRef} className="relative">
              <label className="block text-xs text-ink-muted mb-1.5">رویداد</label>
              <button
                type="button"
                onClick={() => setEventMenuOpen((open) => !open)}
                className="input-field !flex items-center justify-between gap-3 text-right"
                aria-haspopup="listbox"
                aria-expanded={eventMenuOpen}
              >
                <span className={eventFilter.length > 0 ? 'min-w-0 truncate text-ink-strong' : 'text-ink-muted'}>
                  {eventFilter.length === 0 && 'همه رویدادها'}
                  {eventFilter.length === 1 && draftEvents[0]?.title}
                  {eventFilter.length > 1 && `${eventFilter.length.toLocaleString('fa-IR')} رویداد انتخاب شده`}
                </span>
                <ChevronDownIcon className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${eventMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {eventMenuOpen && (
                <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line-strong bg-surface-card shadow-2xl">
                  <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                    <span className="text-xs font-bold text-ink-strong">
                      {eventFilter.length.toLocaleString('fa-IR')} انتخاب
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEventFilter(events.map((event) => event.id))}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-ink hover:bg-brand-soft"
                      >
                        انتخاب همه
                      </button>
                      {eventFilter.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEventFilter([])}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-danger-ink hover:bg-danger-soft"
                        >
                          پاک کردن
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-line p-2.5">
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-alt px-2.5">
                      <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                      <input
                        type="search"
                        value={eventSearch}
                        onChange={(event) => setEventSearch(event.target.value)}
                        placeholder="جست‌وجوی رویداد..."
                        className="min-w-0 flex-1 bg-transparent py-2 text-xs text-ink-strong outline-none placeholder:text-ink-faint"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5" role="listbox" aria-multiselectable="true">
                    {visibleEventOptions.map((event) => {
                      const selected = eventFilter.includes(event.id);
                      return (
                        <button
                          type="button"
                          key={event.id}
                          onClick={() => toggleEventFilter(event.id)}
                          role="option"
                          aria-selected={selected}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-right transition-colors ${selected ? 'bg-brand-soft text-brand-ink' : 'text-ink hover:bg-surface-alt'}`}
                        >
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-brand-accent bg-brand-accent text-white' : 'border-line-strong bg-surface-card'}`}>
                            {selected && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-medium leading-5">{event.title}</span>
                        </button>
                      );
                    })}
                    {visibleEventOptions.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-ink-faint">رویدادی پیدا نشد</p>
                    )}
                  </div>
                </div>
              )}
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

          {draftEvents.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-ink-faint">انتخاب فعلی:</span>
              {draftEvents.map((event) => (
                <span key={event.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-border bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-ink">
                  <span className="break-words">{event.title}</span>
                  <button
                    type="button"
                    onClick={() => toggleEventFilter(event.id)}
                    className="shrink-0 rounded-full p-0.5 hover:bg-surface-card"
                    aria-label={`حذف ${event.title} از فیلتر`}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

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
                      ? 'فیلتر رویداد روی همه بخش‌ها اعمال شده است؛ بازه تاریخ نیز رکوردهای رزرو، جدول و CSV را محدود می‌کند.'
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
                {appliedEvents.map((event) => (
                  <span key={event.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs font-medium text-brand-ink">
                    رویداد: <span className="break-words">{event.title}</span>
                  </span>
                ))}
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
                        {selectedEventCount === 1
                          ? `روند ثبت رزروهای ${singleSelectedEvent?.name || 'رویداد انتخاب‌شده'}`
                          : hasActiveFilters
                            ? 'رزروهای منطبق به تفکیک رویداد'
                            : 'توزیع کل رزروها به تفکیک رویداد'}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">
                        {selectedEventCount === 1
                          ? 'هر نقطه تعداد رزروهای ثبت‌شده در یک روز را نشان می‌دهد؛ بنابراین این نمودار با نمودار وضعیت‌ها تکراری نیست.'
                          : 'هر ردیف دقیقاً از همان رزروهایی ساخته شده که در جدول جزئیات پایین صفحه نمایش داده می‌شوند.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                    {selectedEventCount === 1 ? (
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-medium text-ink-muted">
                        {dailyTrendData.length.toLocaleString('fa-IR')} روز دارای رزرو
                      </span>
                    ) : sortedBarData.length > 0 && (
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-medium text-ink-muted">
                        {sortedBarData.length.toLocaleString('fa-IR')} رویداد
                      </span>
                    )}
                    <span className="rounded-full border border-brand-border bg-brand-soft px-2.5 py-1 font-bold text-brand-ink">
                      {totalMatchingReservations.toLocaleString('fa-IR')} رزرو نمایش‌داده‌شده
                    </span>
                  </div>
                </div>

                {!singleSelectedEvent && sortedBarData.length > 0 && (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-2.5">
                        <p className="text-[10px] font-medium text-ink-faint">کل رزروهای نمایش‌داده‌شده</p>
                        <p className="mt-1 text-base font-extrabold text-ink-strong tabular-nums">
                          {totalMatchingReservations.toLocaleString('fa-IR')} رزرو
                        </p>
                      </div>
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-2.5">
                        <p className="text-[10px] font-medium text-ink-faint">رزرو فعال در نتایج</p>
                        <p className="mt-1 text-base font-extrabold text-ink-strong tabular-nums">
                          {activeReservationCount.toLocaleString('fa-IR')}
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0 rounded-xl border border-line bg-surface-alt px-3 py-3">
                        <p className="text-[10px] font-medium text-ink-faint">بیشترین تعداد رزرو در نتایج</p>
                        <p className="mt-1.5 whitespace-normal break-words text-sm font-bold leading-6 text-ink-strong">
                          {totalMatchingReservations === 0
                            ? 'هیچ رزروی با فیلتر فعلی منطبق نیست'
                            : leadingEvent.name}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand-border bg-brand-soft px-3.5 py-3">
                      <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                      <p className="text-xs leading-5 text-brand-ink">
                        {totalMatchingReservations > 0 ? (
                          <>
                            <strong>{leadingEvent.name}</strong> با{' '}
                            <strong>{leadingEvent.matchingCount.toLocaleString('fa-IR')} رزرو</strong>{' '}
                            بیشترین سهم از نتایج فعلی را دارد. در کل نتایج،{' '}
                            <strong>{activeReservationCount.toLocaleString('fa-IR')} فعال</strong>،{' '}
                            <strong>{cancelledReservationCount.toLocaleString('fa-IR')} لغوشده</strong> و{' '}
                            <strong>{completedReservationCount.toLocaleString('fa-IR')} تکمیل‌شده</strong> است.
                          </>
                        ) : 'برای فیلتر فعلی داده‌ای وجود ندارد؛ رویداد یا بازه تاریخ را تغییر دهید.'}
                      </p>
                    </div>
                  </>
                )}

                {singleSelectedEvent ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-brand-border bg-brand-soft px-4 py-4">
                      <p className="text-xs font-medium text-brand-ink">رویداد انتخاب‌شده</p>
                      <h4 className="mt-1.5 whitespace-normal break-words text-base font-extrabold leading-7 text-ink-strong">
                        {singleSelectedEvent.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-3">
                        <p className="text-[10px] font-medium text-ink-faint">رزرو در بازه انتخابی</p>
                        <p className="mt-1 text-xl font-extrabold text-ink-strong tabular-nums">
                          {singleSelectedEvent.matchingCount.toLocaleString('fa-IR')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-3">
                        <p className="text-[10px] font-medium text-ink-faint">میانگین روزهای دارای رزرو</p>
                        <p className="mt-1 text-xl font-extrabold text-brand-ink tabular-nums">
                          {averageDailyReservations.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}
                        </p>
                      </div>
                      <div className="rounded-xl border border-line bg-surface-alt px-3 py-3">
                        <p className="text-[10px] font-medium text-ink-faint">بیشترین ثبت در یک روز</p>
                        <p className="mt-1 text-xl font-extrabold text-warning-ink tabular-nums">
                          {(busiestDay?.count || 0).toLocaleString('fa-IR')}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-line bg-surface-alt px-3 pb-2 pt-4 sm:px-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                        <span className="text-xs font-bold text-ink-strong">تعداد رزرو ثبت‌شده در هر روز</span>
                        {busiestDay && (
                          <span className="text-[11px] font-medium text-ink-muted">
                            اوج: {busiestDay.count.toLocaleString('fa-IR')} رزرو در {busiestDay.label}
                          </span>
                        )}
                      </div>
                      {dailyTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={270}>
                          <LineChart data={dailyTrendData} margin={{ top: 22, right: 10, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                            <XAxis
                              dataKey="label"
                              stroke={chartColors.axis}
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              minTickGap={24}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              stroke={chartColors.axis}
                              fontSize={10}
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={false}
                              width={30}
                            />
                            <Tooltip
                              formatter={(value) => [`${Number(value).toLocaleString('fa-IR')} رزرو`, 'تعداد ثبت']}
                              contentStyle={chartTooltipStyle}
                              labelStyle={chartTooltipLabelStyle}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="تعداد رزرو"
                              stroke={chartColors.primary}
                              strokeWidth={3}
                              connectNulls={false}
                              dot={{ fill: chartColors.primary, r: 4.5, strokeWidth: 2, stroke: chartColors.dotStroke }}
                              activeDot={{ r: 7, strokeWidth: 3, stroke: chartColors.dotStroke }}
                              label={dailyTrendData.length <= 12 ? {
                                position: 'top',
                                fill: chartColors.axis,
                                fontSize: 10,
                              } : undefined}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="my-8 rounded-lg bg-surface-muted px-3 py-8 text-center text-xs text-ink-faint">
                          در محدوده انتخاب‌شده هیچ رزروی ثبت نشده است.
                        </p>
                      )}
                    </div>

                    {busiestDay && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-brand-border bg-brand-soft px-3.5 py-3">
                        <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                        <p className="text-xs leading-5 text-brand-ink">
                          بیشترین ثبت رزرو این رویداد در <strong>{busiestDay.label}</strong> با{' '}
                          <strong>{busiestDay.count.toLocaleString('fa-IR')} رزرو</strong> بوده است. نمودار وضعیت سمت چپ، همین نتایج را از نظر فعال، لغوشده و تکمیل‌شده تحلیل می‌کند.
                        </p>
                      </div>
                    )}
                  </div>
                ) : sortedBarData.length > 0 ? (
                  <div className="space-y-2" role="list" aria-label="مقایسه تعداد رزروهای نمایش‌داده‌شده رویدادها">
                    {sortedBarData.map((entry, index) => {
                      const relativeWidth = maxMatchingReservations > 0
                        ? (entry.matchingCount / maxMatchingReservations) * 100
                        : 0;
                      const resultShare = totalMatchingReservations > 0
                        ? (entry.matchingCount / totalMatchingReservations) * 100
                        : 0;

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
                              {entry.matchingCount.toLocaleString('fa-IR')} رزرو
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-[3.25rem] text-[11px] text-ink-faint">
                            <span><strong className="text-success-ink">{entry.matchingActive.toLocaleString('fa-IR')}</strong> فعال</span>
                            <span aria-hidden="true">•</span>
                            <span><strong className="text-danger-ink">{entry.matchingCancelled.toLocaleString('fa-IR')}</strong> لغوشده</span>
                            <span aria-hidden="true">•</span>
                            <span><strong className="text-brand-ink">{entry.matchingCompleted.toLocaleString('fa-IR')}</strong> تکمیل‌شده</span>
                          </div>

                          <div className="mt-2 flex items-center gap-3 pr-[3.25rem]">
                            <div
                              className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
                              role="progressbar"
                              aria-label={`${entry.name}: ${entry.matchingCount} رزرو نمایش‌داده‌شده`}
                              aria-valuemin={0}
                              aria-valuemax={Math.max(maxMatchingReservations, 1)}
                              aria-valuenow={entry.matchingCount}
                            >
                              <div
                                className="ml-auto h-full rounded-full transition-[width,filter] duration-700 ease-out group-hover:brightness-110"
                                style={{
                                  width: `${Math.max(relativeWidth, entry.matchingCount > 0 ? 3 : 0)}%`,
                                  backgroundColor: entry.color,
                                  boxShadow: `0 0 14px color-mix(in srgb, ${entry.color} 34%, transparent)`,
                                }}
                              />
                            </div>
                            <span className="w-12 shrink-0 text-left text-[11px] font-medium text-ink-faint tabular-nums" dir="ltr">
                              {resultShare.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-[12px] border-surface-muted bg-surface-alt">
                      <strong className="text-2xl font-extrabold text-ink-strong">۰</strong>
                      <span className="mt-1 text-[10px] font-medium text-ink-faint">
                        از {totalReservationCount.toLocaleString('fa-IR')} رزرو
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-ink-muted">رزروی با فیلتر فعلی پیدا نشد</p>
                  </div>
                )}
              </div>

              {/* Donut Chart + Legend */}
              <div className="card self-start p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink-strong">
                      {hasActiveFilters ? 'ترکیب وضعیت رزروهای منطبق' : 'ترکیب وضعیت کل رزروها'}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      ترکیب رزروهای فعال، لغوشده و تکمیل‌شده در نتایج فعلی
                    </p>
                  </div>
                  {totalStatusReservations > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-line-strong bg-surface-alt px-2.5 py-1 font-bold text-ink-strong">
                        {hasActiveFilters
                          ? `${totalStatusReservations.toLocaleString('fa-IR')} از ${totalReservationCount.toLocaleString('fa-IR')} رزرو`
                          : `${totalStatusReservations.toLocaleString('fa-IR')} رزرو`}
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
                              `${Number(value).toLocaleString('fa-IR')} از ${totalStatusReservations.toLocaleString('fa-IR')} رزرو`,
                              item.payload?.name || name,
                            ]}
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                          />
                          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-ink-strong text-2xl font-extrabold">
                            {totalStatusReservations.toLocaleString('fa-IR')}
                          </text>
                          <text x="50%" y="59%" textAnchor="middle" dominantBaseline="central" className="fill-ink-faint text-[10px] font-medium">
                            {hasActiveFilters
                              ? `از ${totalReservationCount.toLocaleString('fa-IR')} رزرو`
                              : 'کل رزروها'}
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
                                  {entry.value.toLocaleString('fa-IR')} از {totalStatusReservations.toLocaleString('fa-IR')}
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
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-[12px] border-surface-muted bg-surface-alt">
                      <strong className="text-2xl font-extrabold text-ink-strong">۰</strong>
                      <span className="mt-1 text-[10px] font-medium text-ink-faint">
                        از {totalReservationCount.toLocaleString('fa-IR')} رزرو
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-ink-muted">رزروی با فیلتر فعلی پیدا نشد</p>
                  </div>
                )}
              </div>
            </div>

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
                {appliedEvents.length === 1 && (
                  <span className="text-sm font-normal text-ink-faint mr-2">— {appliedEvents[0].title}</span>
                )}
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
