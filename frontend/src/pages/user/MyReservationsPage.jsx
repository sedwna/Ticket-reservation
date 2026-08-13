import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, ClockIcon, TicketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import reservationService from '../../services/reservationService';
import defaultData from '../../data/defaultData';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function MyReservationsPage() {
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [a, h] = await Promise.all([
        reservationService.getMyReservations('active'),
        reservationService.getMyReservations('history'),
      ]);
      if (a.success) setActive(a.data || []);
      else setActive(defaultData.reservations.active);
      if (h.success) setHistory(h.data || []);
      else setHistory(defaultData.reservations.history);
    } catch {
      setActive(defaultData.reservations.active);
      setHistory(defaultData.reservations.history);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const r = await reservationService.cancel(cancelModal.id);
      if (r.success) {
        toast.success('رزرو با موفقیت لغو شد');
        setActive(prev => prev.filter(x => x.id !== cancelModal.id));
        setHistory(prev => [{ ...cancelModal, status: 'CANCELLED' }, ...prev]);
        setCancelModal(null);
      } else {
        toast.error(r.message);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'خطا'); }
    finally { setCancelling(false); }
  };

  const data = tab === 'active' ? active : history;

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up max-w-4xl">
        <h2 className="text-3xl font-extrabold text-ink-strong mb-2">رزروهای من</h2>
        <p className="text-ink-muted mb-8">مشاهده و مدیریت رزروهای ثبت‌شده</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted rounded-xl p-1 mb-8 w-fit">
          {['active', 'history'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t ? 'bg-surface-card text-ink-strong shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t === 'active' ? 'فعال' : 'تاریخچه'}
              <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-surface-muted text-ink' : 'bg-surface-raised text-ink-muted'}`}>
                {t === 'active' ? active.length : history.length}
              </span>
            </button>
          ))}
        </div>

        {loading && <LoadingSkeleton message="در حال بارگذاری رزروها..." />}

        {!loading && data.length === 0 && (
          <EmptyState
            icon={TicketIcon}
            title={tab === 'active' ? 'رزرو فعالی ندارید' : 'تاریخچه‌ای موجود نیست'}
            description={tab === 'active' ? 'هنوز هیچ صندلی رزرو نکرده‌اید. برای شروع به صفحه رویدادها بروید.' : ''}
            linkTo={tab === 'active' ? '/events' : null}
            linkText="مشاهده رویدادها"
          />
        )}

        {!loading && data.length > 0 && (
          <div className="space-y-4">
            {data.map((r) => (
              <div
                key={r.id}
                className={`card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  r.status === 'CANCELLED' ? 'opacity-60 bg-surface-alt' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.status === 'CANCELLED' ? 'bg-surface-muted' : 'bg-brand-soft'
                  }`}>
                    <TicketIcon className={`w-6 h-6 ${r.status === 'CANCELLED' ? 'text-ink-faint' : 'text-brand-accent'}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-ink-strong">{r.event_title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted mt-1">
                      <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />{r.event_date}</span>
                      <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{r.start_time} — {r.end_time}</span>
                    </div>
                    <p className="text-sm mt-1">
                      <span className="text-brand-ink font-semibold">صندلی {r.seat_label}</span>
                      <span className="text-ink-faint text-xs mr-2">(ردیف {r.row_number})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <Badge status={r.status} />
                  {r.status === 'ACTIVE' && (
                    <Button onClick={() => setCancelModal(r)} variant="ghost" size="sm" className="!text-red-500 hover:!bg-danger-soft hover:!text-danger-ink">
                      لغو
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="لغو رزرو" size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-ink mb-2">آیا از لغو این رزرو اطمینان دارید؟ این عملیات قابل بازگشت نیست.</p>
          <p className="mb-4 text-xs leading-5 text-ink-muted">
            پس از لغو، صندلی برای رزرو سایر کاربران آزاد می‌شود.
          </p>
          {cancelModal && (
            <div className="bg-danger-soft rounded-xl p-4 text-sm text-left space-y-1 mb-6">
              <p className="font-bold text-ink-strong">{cancelModal.event_title}</p>
              <p className="text-ink-muted">صندلی: {cancelModal.seat_label}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setCancelModal(null)} variant="ghost" size="md">انصراف</Button>
            <Button onClick={handleCancel} disabled={cancelling} variant="danger" size="md">
              {cancelling ? 'در حال لغو...' : 'تأیید لغو'}
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
