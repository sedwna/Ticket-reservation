import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import eventService from '../../services/eventService';
import reservationService from '../../services/reservationService';
import defaultData from '../../data/defaultData';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { SeatMapSkeleton } from '../../components/common/LoadingSkeleton';

const legendItems = [
  { color: 'bg-emerald-400 border-emerald-500', label: 'معمولی (آزاد)' },
  { color: 'bg-amber-400 border-amber-500', label: 'VIP (آزاد)' },
  { color: 'bg-red-400 border-red-500', label: 'رزرو شده' },
  { color: 'bg-sky-400 border-sky-500', label: 'رزرو شما' },
  { color: 'bg-amber-400 border-amber-500 ring-2 ring-amber-300 scale-110', label: 'انتخاب شده' },
];

export default function SeatMapPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const fetchSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      const r = await eventService.getSeatMap(eventId);
      if (r.success) {
        setSeatMap(r.data);
      } else if (defaultData.seatMaps[eventId]) {
        setSeatMap(defaultData.seatMaps[eventId]);
      } else {
        toast.error(r.message || 'خطا در دریافت نقشه');
      }
    } catch (err) {
      if (defaultData.seatMaps[eventId]) {
        setSeatMap(defaultData.seatMaps[eventId]);
      } else {
        toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور');
      }
    } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchSeatMap, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchSeatMap]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'RESERVED' || seat.status === 'RESERVED_BY_USER') return;
    setSelectedSeat(prev => prev?.id === seat.id ? null : seat);
  };

  const handleReserve = async () => {
    setReserving(true);
    setConfirmModal(false);
    try {
      const r = await reservationService.create(eventId, selectedSeat.id);
      if (r.success) {
        setSuccessData(r.data);
        setSuccessModal(true);
        setSelectedSeat(null);
        fetchSeatMap();
      } else {
        toast.error(r.message || 'خطا در رزرو');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در رزرو صندلی');
    } finally { setReserving(false); }
  };

  const seatStyle = (seat) => {
    if (seat.status === 'RESERVED') return 'bg-red-400 border-red-500 text-white/70 cursor-not-allowed';
    if (seat.status === 'RESERVED_BY_USER') return 'bg-sky-400 border-sky-500 text-white/70 cursor-not-allowed';
    if (selectedSeat?.id === seat.id) return 'bg-amber-400 border-amber-500 text-white ring-2 ring-amber-300 scale-110 z-10';
    if (seat.seat_type === 'VIP') return 'bg-amber-400 border-amber-500 text-white hover:bg-amber-500 hover:scale-110 cursor-pointer font-bold';
    return 'bg-emerald-400 border-emerald-500 text-white hover:bg-emerald-500 hover:scale-110 cursor-pointer';
  };

  if (loading) return (
    <div className="page-shell"><Navbar />
      <main className="page-content"><SeatMapSkeleton /></main>
    </div>
  );

  if (!seatMap) return (
    <div className="page-shell"><Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink text-lg mb-4">رویداد یافت نشد</p>
          <Button onClick={() => navigate('/events')} variant="ghost" size="md">بازگشت</Button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <Button onClick={() => navigate('/events')} variant="icon" size="icon" className="mt-0.5 flex-shrink-0">
            <ArrowRightIcon className="w-5 h-5" />
          </Button>
          {seatMap.poster_url && (
            <img src={seatMap.poster_url} alt="" className="w-24 h-24 rounded-2xl object-cover border border-line-strong shadow-sm flex-shrink-0 hidden sm:block" />
          )}
          <div>
            <h2 className="text-2xl font-extrabold text-ink-strong mb-1">{seatMap.event_title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ink-subtle" />
                ظرفیت: {seatMap.total_capacity}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                آزاد: {seatMap.available_seats}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                رزرو شده: {seatMap.reserved_seats}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 mb-8 bg-surface-card rounded-xl border border-line px-5 py-3">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-ink">
              <div className={`w-6 h-6 rounded-md border shadow-sm ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Cinema Layout */}
        <div className="bg-surface-card rounded-2xl border border-line p-6 sm:p-10 overflow-x-auto">
          {/* Stage */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="h-3 bg-surface-raised rounded-t-full" />
            <div className="bg-gradient-to-b from-surface-raised to-surface-muted text-center py-5 rounded-b-lg border border-line-strong">
              <span className="text-sm font-bold text-ink-faint tracking-widest uppercase">صحنه</span>
            </div>
          </div>

          {/* Seats */}
          <div className="space-y-2.5">
            {Object.entries(seatMap.rows).map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="flex items-center justify-center gap-2">
                <span className="w-7 text-center text-xs font-bold text-ink-faint">
                  {String.fromCharCode(64 + parseInt(rowNum))}
                </span>
                <div className="flex gap-1.5">
                  {rowSeats.map(seat => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'RESERVED' || seat.status === 'RESERVED_BY_USER'}
                      className={`w-9 h-9 rounded-lg border text-[10px] font-bold transition-all duration-200 ${seatStyle(seat)}`}
                      title={`${seat.seat_label} — ${seat.status === 'AVAILABLE' ? 'آزاد' : seat.status === 'RESERVED_BY_USER' ? 'رزرو شما' : 'رزرو شده'}`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
                <span className="w-7 text-center text-xs font-bold text-ink-faint">
                  {String.fromCharCode(64 + parseInt(rowNum))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Reserve Panel */}
        {selectedSeat && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-down w-[calc(100%-2rem)] max-w-lg">
            <div className="bg-surface-card rounded-2xl shadow-elevated border border-line p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-ink-strong">صندلی {selectedSeat.seat_label}</p>
                <p className="text-sm text-ink-muted">
                  ردیف {String.fromCharCode(64 + selectedSeat.row_number)}، شماره {selectedSeat.seat_number}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setSelectedSeat(null)} variant="ghost" size="sm">
                  انصراف
                </Button>
                <Button onClick={() => setConfirmModal(true)} variant="primary" size="sm" className="!px-8">
                  تأیید رزرو
                </Button>
              </div>
            </div>
          </div>
        )}

        {reserving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-surface-card rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
              <div className="w-12 h-12 rounded-full border-4 border-brand-border border-t-brand-700 animate-spin mx-auto mb-4" />
              <p className="font-medium text-ink">در حال ثبت رزرو...</p>
            </div>
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="تأیید نهایی رزرو" size="sm">
        <div className="text-center">
          <p className="text-ink mb-2">آیا از رزرو این صندلی اطمینان دارید؟</p>
          {selectedSeat && (
            <div className="bg-surface-alt rounded-xl p-4 my-4 text-sm space-y-1">
              <p className="font-bold text-ink-strong">صندلی {selectedSeat.seat_label}</p>
              <p className="text-ink-muted">ردیف {String.fromCharCode(64 + selectedSeat.row_number)}</p>
              <p className="text-ink-faint text-xs">{seatMap?.event_title}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => setConfirmModal(false)} variant="ghost" size="md">
              انصراف
            </Button>
            <Button onClick={handleReserve} variant="primary" size="md">
              تأیید نهایی
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={successModal} onClose={() => { setSuccessModal(false); navigate('/my-reservations'); }} size="sm">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-extrabold text-ink-strong mb-2">رزرو موفق!</h3>
          <p className="text-ink-muted text-sm mb-4">صندلی شما با موفقیت رزرو شد</p>
          {successData && (
            <div className="bg-surface-alt rounded-xl p-4 mb-6 text-sm text-ink space-y-1">
              <p><span className="text-ink-faint">رویداد:</span> {successData.event_title}</p>
              <p><span className="text-ink-faint">تاریخ:</span> {successData.event_date}</p>
              <p><span className="text-ink-faint">صندلی:</span> <span className="font-bold text-brand-ink">{successData.seat_label}</span></p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setSuccessModal(false); navigate('/events'); }} variant="ghost" size="md">
              رویدادها
            </Button>
            <Button onClick={() => { setSuccessModal(false); navigate('/my-reservations'); }} variant="primary" size="md">
              رزروهای من
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
