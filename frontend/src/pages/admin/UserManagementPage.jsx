import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, UserCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleModal, setRoleModal] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setLoading(true); const r = await adminService.getUsers(); if (r.success) setUsers(r.data || []); } catch {} finally { setLoading(false); }
  };

  const toggleStatus = async (userId) => {
    try {
      const r = await adminService.toggleUserStatus(userId);
      if (r.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
        toast.success('وضعیت کاربر تغییر کرد');
      } else toast.error(r.message);
    } catch { toast.error('خطا'); }
  };

  const changeRole = async () => {
    if (!roleModal) return;
    setRoleLoading(true);
    try {
      const newRole = roleModal.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const r = await adminService.changeUserRole(roleModal.id, newRole);
      if (r.success) {
        setUsers(prev => prev.map(u => u.id === roleModal.id ? { ...u, role: newRole } : u));
        toast.success('نقش کاربر تغییر کرد');
        setRoleModal(null);
      } else toast.error(r.message);
    } catch { toast.error('خطا'); }
    finally { setRoleLoading(false); }
  };

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${u.first_name} ${u.last_name}`.toLowerCase().includes(q) && !u.student_id.includes(q) && !u.email.includes(q)) return false;
    }
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8">مدیریت کاربران</h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، شماره دانشجویی یا ایمیل..." className="input-field !pr-10" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field sm:w-36">
            <option value="">همه</option><option value="ADMIN">مدیر</option><option value="USER">کاربر</option>
          </select>
        </div>

        {loading && <TableSkeleton rows={5} cols={7} />}

        {!loading && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">کاربر</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">ش. دانشجویی</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">ایمیل</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">نقش</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">رزروها</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">وضعیت</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <UserCircleIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-800">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 ltr text-left" dir="ltr">{u.student_id}</td>
                    <td className="py-3 px-4 text-slate-500 ltr text-left text-xs" dir="ltr">{u.email}</td>
                    <td className="py-3 px-4"><Badge status={u.role} size="xs" /></td>
                    <td className="py-3 px-4 text-slate-600">{u.reservation_count || 0}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleStatus(u.id)}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${u.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${u.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setRoleModal(u)} className="btn-icon !w-8 !h-8 !rounded-lg" title="تغییر نقش">
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="تغییر نقش کاربر" size="sm">
        {roleModal && (
          <div className="text-center">
            <p className="text-slate-600 mb-4">تغییر نقش کاربر:</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
              <p className="font-bold">{roleModal.first_name} {roleModal.last_name}</p>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="text-slate-400">فعلی:</span> <Badge status={roleModal.role} />
                <span className="text-slate-300">→</span>
                <span className="text-slate-400">جدید:</span> <Badge status={roleModal.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setRoleModal(null)} className="btn-ghost">انصراف</button>
              <button onClick={changeRole} disabled={roleLoading} className="btn-primary">{roleLoading ? 'در حال تغییر...' : 'تأیید'}</button>
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
