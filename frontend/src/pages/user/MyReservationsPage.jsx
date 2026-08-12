import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, ClockIcon, TicketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import reservationService from '../../services/reservationService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
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

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [a, h] = await Promise.all([
        reservationService.getMyReservations('active'),
        reservationService.getMyReservations('history'),
      ]);
      if (a.success) setActive(a.data || []);
      if (h.success) setHistory(h.data || []);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  };

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
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">رزروهای من</h2>
        <p className="text-slate-500 mb-8">مشاهده و مدیریت رزروهای ثبت‌شده</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
          {['active', 'history'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'active' ? 'فعال' : 'تاریخچه'}
              <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
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
                  r.status === 'CANCELLED' ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.status === 'CANCELLED' ? 'bg-slate-100' : 'bg-brand-50'
                  }`}>
                    <TicketIcon className={`w-6 h-6 ${r.status === 'CANCELLED' ? 'text-slate-400' : 'text-brand-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900">{r.event_title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />{r.event_date}</span>
                      <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{r.start_time} — {r.end_time}</span>
                    </div>
                    <p className="text-sm mt-1">
                      <span className="text-brand-700 font-semibold">صندلی {r.seat_label}</span>
                      <span className="text-slate-400 text-xs mr-2">(ردیف {r.row_number})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <Badge status={r.status} />
                  {r.status === 'ACTIVE' && (
                    <Button onClick={() => setCancelModal(r)} variant="ghost" size="sm" className="!text-red-500 hover:!bg-red-50 hover:!text-red-600">
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
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-600 mb-4">آیا از لغو این رزرو اطمینان دارید؟ این عملیات قابل بازگشت نیست.</p>
          {cancelModal && (
            <div className="bg-red-50 rounded-xl p-4 text-sm text-left space-y-1 mb-6">
              <p className="font-bold text-slate-800">{cancelModal.event_title}</p>
              <p className="text-slate-500">صندلی: {cancelModal.seat_label}</p>
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
