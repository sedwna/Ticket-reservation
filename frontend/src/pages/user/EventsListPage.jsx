import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import eventService from '../../services/eventService';
import defaultData from '../../data/defaultData';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const r = await eventService.getActiveEvents();
      if (r.success) {
        setEvents(r.data || defaultData.events);
      } else {
        setEvents(defaultData.events);
      }
    } catch {
      setEvents(defaultData.events);
    } finally { setLoading(false); }
  };

  const filtered = events.filter(e => {
    if (search && !e.title.includes(search)) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const occupancyColor = (rate) =>
    rate >= 90 ? 'bg-red-400' : rate >= 70 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">رویدادهای فعال</h2>
            <p className="text-slate-500 mt-1">رویدادهای در حال برگزاری را مشاهده و صندلی رزرو کنید</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس عنوان..."
              className="input-field !pr-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-44">
            <option value="">همه وضعیت‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="CLOSED">پایان ثبت‌نام</option>
            <option value="COMPLETED">برگزار شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={CalendarDaysIcon}
            title="رویداد فعالی یافت نشد"
            description="در حال حاضر رویداد فعالی وجود ندارد. لطفاً بعداً مراجعه کنید."
          />
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <div key={event.id} className="card-interactive group p-0 overflow-hidden">
                {/* Poster */}
                {event.poster_url ? (
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img src={event.poster_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-3 right-3"><Badge status={event.status} /></div>
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                    <CalendarDaysIcon className="w-8 h-8 text-brand-300" />
                  </div>
                )}
                <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  {!event.poster_url && <Badge status={event.status} />}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {event.event_date}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-brand-700 transition-colors">
                  {event.title}
                </h3>

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <span className="font-medium text-slate-700"> برگزارکننده: </span>
                    <span>{event.organizer.name}</span>
                    {event.organizer.email && <span className="text-xs text-slate-400">· {event.organizer.email}</span>}
                  </div>
                )}

                {/* Time */}
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                  <ClockIcon className="w-4 h-4" />
                  {event.start_time} — {event.end_time}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>ظرفیت: {event.total_capacity} نفر</span>
                    <span className="font-medium">{event.available_count} صندلی باقی‌مانده</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${occupancyColor(event.occupancy_rate)}`}
                      style={{ width: `${Math.min(100, event.occupancy_rate)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {Math.round(event.occupancy_rate || 0)}% پر شده
                  </p>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => navigate(`/events/${event.id}/seats`)}
                  disabled={event.available_count <= 0 || event.status !== 'ACTIVE'}
                  variant="primary"
                  size="md"
                  fullWidth
                  className="!rounded-xl"
                >
                  {event.available_count <= 0 ? 'ظرفیت تکمیل است' :
                   event.status === 'CLOSED' ? 'پایان ثبت‌نام' :
                   event.status === 'CANCELLED' ? 'لغو شده' :
                   event.status !== 'ACTIVE' ? 'برگزار شده' : 'مشاهده و رزرو'}
                </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
