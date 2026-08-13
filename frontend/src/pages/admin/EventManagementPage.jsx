import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon,
  PhotoIcon, XMarkIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon,
} from '@heroicons/react/24/outline';
import eventService from '../../services/eventService';
import uploadService from '../../services/uploadService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const DEFAULT_ROW = { seats: 10, seat_type: 'REGULAR' };
const EVENT_STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'ACTIVE', label: 'فعال' },
  { value: 'CLOSED', label: 'پایان ثبت‌نام' },
  { value: 'COMPLETED', label: 'برگزار شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
];

export default function EventManagementPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form state
  const [form, setForm] = useState({ title: '', description: '', event_date: '', start_time: '', end_time: '', total_capacity: 50 });
  const [rows, setRows] = useState([{ ...DEFAULT_ROW }]);
  const [useLegacy, setUseLegacy] = useState(false);
  const [legacyRows, setLegacyRows] = useState(5);
  const [legacySeats, setLegacySeats] = useState(10);

  // Poster
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterURL, setPosterURL] = useState('');
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const fileInputRef = useRef(null);

  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await eventService.getAdminEvents();
      if (!response.success) throw new Error(response.message || 'خطا در دریافت رویدادها');
      setEvents(response.data || []);
    } catch (error) {
      setEvents([]);
      setLoadError(error.response?.data?.message || error.message || 'ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchEvents, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Calculate total capacity from rows
  const calcCapacity = (rowList) => rowList.reduce((sum, r) => sum + (parseInt(r.seats) || 0), 0);

  // Row management
  const addRow = () => setRows([...rows, { ...DEFAULT_ROW }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); };
  const updateRow = (i, field, val) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: field === 'seats' ? parseInt(val) || 0 : val };
    setRows(updated);
  };
  const moveRow = (i, dir) => {
    if ((dir === -1 && i === 0) || (dir === 1 && i === rows.length - 1)) return;
    const updated = [...rows];
    [updated[i], updated[i + dir]] = [updated[i + dir], updated[i]];
    setRows(updated);
  };

  // Poster handling
  const handlePosterSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم فایل نباید بیش از ۵ مگابایت باشد'); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('فرمت فایل باید jpg، png یا webp باشد'); return; }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
    setPosterURL('');
  };

  const uploadPoster = async () => {
    if (!posterFile) return posterURL;
    setUploadingPoster(true);
    try {
      const r = await uploadService.uploadPoster(posterFile);
      if (r.success) { setPosterURL(r.data.poster_url); return r.data.poster_url; }
      toast.error(r.message || 'خطا در آپلود پوستر');
      return '';
    } catch { toast.error('خطا در آپلود پوستر'); return ''; }
    finally { setUploadingPoster(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', event_date: '', start_time: '', end_time: '', total_capacity: 50 });
    setRows([{ ...DEFAULT_ROW }]);
    setUseLegacy(false);
    setLegacyRows(5); setLegacySeats(10);
    setPosterFile(null); setPosterPreview(''); setPosterURL('');
    setFormModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ title: e.title || '', description: e.description || '', event_date: e.event_date || '', start_time: e.start_time || '', end_time: e.end_time || '', total_capacity: e.total_capacity || 50 });
    setRows([{ ...DEFAULT_ROW }]); setUseLegacy(false); setLegacyRows(5); setLegacySeats(10);
    setPosterFile(null); setPosterPreview(e.poster_url || ''); setPosterURL(e.poster_url || '');
    setFormModal(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.title || !form.event_date || !form.start_time || !form.end_time) { toast.error('فیلدهای ضروری را پر کنید'); return; }

    setFormLoading(true);
    try {
      // Upload poster first if selected
      let finalPosterURL = posterURL;
      if (posterFile) {
        finalPosterURL = await uploadPoster();
      }

      const totalCap = useLegacy ? legacyRows * legacySeats : calcCapacity(rows);
      const payload = {
        ...form, total_capacity: totalCap, poster_url: finalPosterURL,
      };

      if (!useLegacy) {
        payload.row_config = rows.map((r, i) => ({
          row_number: i + 1, seats: r.seats, seat_type: r.seat_type,
        }));
      } else {
        payload.rows = legacyRows;
        payload.seats_per_row = legacySeats;
      }

      const r = editing
        ? await eventService.updateEvent(editing.id, payload)
        : await eventService.createEvent(payload);

      if (r.success) {
        toast.success(editing ? 'رویداد ویرایش شد' : 'رویداد ایجاد شد');
        setFormModal(false); fetchEvents();
      } else toast.error(r.message || 'خطا');
    } catch (err) { toast.error(err.response?.data?.message || 'خطا'); }
    finally { setFormLoading(false); }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const r = await eventService.updateEvent(eventId, { status: newStatus });
      if (r.success) {
        toast.success('وضعیت رویداد تغییر کرد');
        fetchEvents();
      } else {
        toast.error(r.message || 'خطا');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const r = await eventService.deleteEvent(deleteModal.id);
      if (r.success) { toast.success('رویداد حذف شد'); setEvents(prev => prev.filter(x => x.id !== deleteModal.id)); setDeleteModal(null); }
      else toast.error(r.message);
    } catch { toast.error('خطا در حذف'); }
    finally { setDeleting(false); }
  };

  const normalizedSearch = search.trim().toLocaleLowerCase('fa-IR');
  const searchMatchedEvents = events.filter((event) => (
    !normalizedSearch
    || String(event.title || '').toLocaleLowerCase('fa-IR').includes(normalizedSearch)
  ));
  const statusCounts = searchMatchedEvents.reduce((counts, event) => {
    counts[event.status] = (counts[event.status] || 0) + 1;
    return counts;
  }, {});
  const filtered = statusFilter
    ? searchMatchedEvents.filter((event) => event.status === statusFilter)
    : searchMatchedEvents;
  const selectedStatusLabel = EVENT_STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label;

  const totalCap = useLegacy ? legacyRows * legacySeats : calcCapacity(rows);
  const vipCount = useLegacy ? 0 : rows.filter(r => r.seat_type === 'VIP').reduce((s, r) => s + (parseInt(r.seats) || 0), 0);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-ink-strong">مدیریت رویدادها</h2>
            <p className="text-ink-muted mt-1">ایجاد، ویرایش و حذف رویدادهای سالن</p>
          </div>
          <Button onClick={openCreate} variant="primary" size="md">
            <PlusIcon className="w-5 h-5" /> افزودن رویداد
          </Button>
        </div>

        <div className="bg-surface-card rounded-2xl border border-line p-4 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در عنوان رویدادها..." className="input-field !pr-10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-52" aria-label="فیلتر وضعیت رویداد">
              {EVENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'ALL'} value={option.value}>
                  {option.label} ({(option.value ? statusCounts[option.value] || 0 : searchMatchedEvents.length).toLocaleString('fa-IR')})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3 text-xs text-ink-muted" role="status" aria-live="polite">
            <span>
              نمایش <strong className="text-ink-strong">{filtered.length.toLocaleString('fa-IR')}</strong> رویداد
              {searchMatchedEvents.length !== events.length && ` از ${events.length.toLocaleString('fa-IR')} رویداد`}
            </span>
            {statusFilter && (
              <button type="button" onClick={() => setStatusFilter('')} className="rounded-lg border border-line-strong px-2.5 py-1 text-brand-accent transition-colors hover:border-brand-400 hover:bg-brand-soft">
                فیلتر فعال: {selectedStatusLabel} — پاک کردن
              </button>
            )}
          </div>
        </div>

        {loading && <TableSkeleton rows={6} cols={7} />}
        {!loading && loadError && (
          <EmptyState title="دریافت رویدادها ناموفق بود" description={loadError} />
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <EmptyState
            title={statusFilter ? `رویداد «${selectedStatusLabel}» یافت نشد` : 'رویدادی یافت نشد'}
            description={statusFilter
              ? 'در حال حاضر رویدادی با این وضعیت ثبت نشده است. می‌توانید فیلتر را پاک کنید.'
              : 'عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید.'}
          />
        )}
        {!loading && !loadError && filtered.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">عنوان</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">تاریخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">ظرفیت</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">پوستر</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">پرشدگی</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs">وضعیت</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-muted text-xs"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-line/60 hover:bg-surface-alt/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink-strong">{e.title}</td>
                    <td className="py-3 px-4 text-ink-muted">{e.event_date}</td>
                    <td className="py-3 px-4 text-ink">{e.total_capacity}</td>
                    <td className="py-3 px-4">
                      {e.poster_url ? (
                        <img src={e.poster_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-line-strong" />
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-muted rounded-full max-w-20">
                          <div className={`h-full rounded-full ${e.occupancy_rate >= 90 ? 'bg-red-400' : e.occupancy_rate >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, e.occupancy_rate)}%` }} />
                        </div>
                        <span className="text-xs text-ink-faint">{Math.round(e.occupancy_rate || 0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={e.status}
                        onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                        className="text-xs font-semibold rounded-lg border border-line-strong py-1.5 px-2 bg-surface-card cursor-pointer hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      >
                        <option value="ACTIVE">فعال</option>
                        <option value="CLOSED">پایان ثبت‌نام</option>
                        <option value="COMPLETED">برگزار شده</option>
                        <option value="CANCELLED">لغو شده</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button onClick={() => openEdit(e)} variant="icon" size="icon" className="!w-8 !h-8 !rounded-lg"><PencilSquareIcon className="w-4 h-4" /></Button>
                        <Button onClick={() => setDeleteModal(e)} variant="icon" size="icon" className="!w-8 !h-8 !rounded-lg !text-red-400 hover:!text-danger-ink hover:!bg-danger-soft"><TrashIcon className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Form Modal */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editing ? 'ویرایش رویداد' : 'افزودن رویداد جدید'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">عنوان *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">پوستر رویداد</label>
              <div className="flex items-center gap-3">
                {posterPreview ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-line-strong flex-shrink-0">
                    <img src={posterPreview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(''); setPosterURL(''); }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                      <XCircleIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-line-strong flex items-center justify-center text-ink-faint hover:border-brand-400 hover:text-brand-accent transition-colors">
                    <PhotoIcon className="w-6 h-6" />
                  </button>
                )}
                <div className="text-xs text-ink-faint">
                  <p>jpg، png یا webp</p>
                  <p>حداکثر ۵ مگابایت</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePosterSelect} className="hidden" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">توضیحات</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-ink mb-1">تاریخ *</label><input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} className="input-field ltr text-left" dir="ltr" /></div>
            <div><label className="block text-sm font-medium text-ink mb-1">شروع *</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="input-field ltr text-left" dir="ltr" /></div>
            <div><label className="block text-sm font-medium text-ink mb-1">پایان *</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="input-field ltr text-left" dir="ltr" /></div>
          </div>

          {/* Hall Configuration */}
          {!editing && (
            <div className="bg-surface-alt rounded-xl p-5 border border-line">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-ink-strong">پیکربندی سالن</h4>
                <div className="flex items-center gap-3">
                  {!useLegacy && (
                    <Button type="button" onClick={addRow} variant="ghost" size="sm" className="!py-1.5 !px-3 !text-brand-accent hover:!bg-brand-soft">
                      <PlusIcon className="w-3.5 h-3.5" /> افزودن ردیف
                    </Button>
                  )}
                  <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
                    <input type="checkbox" checked={useLegacy} onChange={(e) => setUseLegacy(e.target.checked)} className="rounded" />
                    حالت ساده (تعداد یکسان)
                  </label>
                </div>
              </div>

              {useLegacy ? (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-ink-muted mb-1">تعداد ردیف</label><input type="number" min="1" value={legacyRows} onChange={e => setLegacyRows(parseInt(e.target.value) || 1)} className="input-field ltr text-left" dir="ltr" /></div>
                  <div><label className="block text-xs text-ink-muted mb-1">صندلی در هر ردیف</label><input type="number" min="1" value={legacySeats} onChange={e => setLegacySeats(parseInt(e.target.value) || 1)} className="input-field ltr text-left" dir="ltr" /></div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    {rows.map((row, i) => (
                      <div key={i} className="flex items-center gap-3 bg-surface-card rounded-lg p-3 border border-line-strong">
                        <span className="text-xs font-bold text-ink-faint w-12 text-center">
                          ردیف {String.fromCharCode(65 + i)}
                        </span>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-ink-faint">صندلی:</label>
                            <input type="number" min="1" max="30" value={row.seats} onChange={e => updateRow(i, 'seats', e.target.value)}
                              className="input-field !w-20 !py-1.5 !text-xs ltr text-left" dir="ltr" />
                          </div>
                          <select value={row.seat_type} onChange={e => updateRow(i, 'seat_type', e.target.value)}
                            className="input-field !w-24 !py-1.5 !text-xs">
                            <option value="REGULAR">معمولی</option>
                            <option value="VIP">VIP</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveRow(i, -1)} className="p-1 text-ink-subtle hover:text-ink"><ArrowUpIcon className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => moveRow(i, 1)} className="p-1 text-ink-subtle hover:text-ink"><ArrowDownIcon className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => removeRow(i)} className="p-1 text-ink-subtle hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-ink bg-surface-card rounded-lg p-3 border border-line">
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> مجموع: <strong className="text-brand-ink">{totalCap}</strong> صندلی</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> VIP: <strong className="text-warning-ink">{vipCount}</strong></span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ink-faint"></span> معمولی: <strong className="text-ink">{totalCap - vipCount}</strong></span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" onClick={() => setFormModal(false)} variant="ghost" size="md">انصراف</Button>
            <Button type="submit" disabled={formLoading || uploadingPoster} variant="primary" size="md">
              {formLoading ? 'در حال ذخیره...' : editing ? 'ذخیره' : 'ایجاد'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="حذف رویداد" size="sm">
        <div className="text-center">
          <p className="text-ink mb-4">آیا از حذف این رویداد اطمینان دارید؟</p>
          {deleteModal && <div className="bg-danger-soft rounded-xl p-4 mb-6 text-sm"><p className="font-bold">{deleteModal.title}</p></div>}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setDeleteModal(null)} variant="ghost" size="md">انصراف</Button>
            <Button onClick={handleDelete} disabled={deleting} variant="danger" size="md">{deleting ? 'حذف...' : 'حذف'}</Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
