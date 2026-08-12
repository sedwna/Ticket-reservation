import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import adminService from '../../services/adminService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const getFullName = (user) => `${user.first_name} ${user.last_name}`.trim();

const getRoleLabel = (role) => (role === 'ADMIN' ? 'مدیر' : 'کاربر');

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleModal, setRoleModal] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const response = await adminService.getUsers();

        if (cancelled) return;

        if (response.success) {
          setUsers(response.data || []);
          return;
        }

        toast.error(response.message || 'خطا در دریافت فهرست کاربران');
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error, 'خطا در دریافت فهرست کاربران'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleStatus = async (user) => {
    if (statusLoadingId !== null) return;

    const nextIsActive = !user.is_active;
    const fullName = getFullName(user);
    const roleLabel = getRoleLabel(user.role);

    setStatusLoadingId(user.id);

    try {
      const response = await adminService.toggleUserStatus(user.id);

      if (!response.success) {
        toast.error(response.message || 'تغییر وضعیت حساب انجام نشد');
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, is_active: nextIsActive }
            : currentUser,
        ),
      );

      toast.success(
        `${roleLabel} «${fullName}» ${nextIsActive ? 'فعال' : 'غیرفعال'} شد`,
        {
          icon: (
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${nextIsActive ? 'bg-emerald-500' : 'bg-red-500'}`}
            >
              {nextIsActive ? (
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              ) : (
                <XMarkIcon className="h-3.5 w-3.5 text-white" />
              )}
            </span>
          ),
        },
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'خطا در تغییر وضعیت حساب'));
    } finally {
      setStatusLoadingId(null);
    }
  };

  const closeRoleModal = () => {
    if (!roleLoading) setRoleModal(null);
  };

  const changeRole = async () => {
    if (!roleModal || roleLoading) return;

    const selectedUser = roleModal;
    const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const fullName = getFullName(selectedUser);

    if (newRole === 'ADMIN' && !selectedUser.is_active) {
      toast.error('برای مدیر کردن این کاربر، ابتدا حساب او را فعال کنید');
      setRoleModal(null);
      return;
    }

    setRoleLoading(true);

    try {
      const response = await adminService.changeUserRole(selectedUser.id, newRole);

      if (!response.success) {
        toast.error(response.message || 'تغییر نقش انجام نشد');
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === selectedUser.id
            ? { ...currentUser, role: newRole }
            : currentUser,
        ),
      );

      toast.success(
        `نقش «${fullName}» به «${getRoleLabel(newRole)}» تغییر کرد`,
      );
      setRoleModal(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'خطا در تغییر نقش کاربر'));
    } finally {
      setRoleLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fa-IR');

    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (!query) return true;

      const searchableText = [
        getFullName(user),
        user.student_id,
        user.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fa-IR');

      return searchableText.includes(query);
    });
  }, [users, search, roleFilter]);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content animate-fade-in-up">
        <h2 className="mb-8 text-3xl font-extrabold text-ink-strong">
          مدیریت کاربران
        </h2>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس نام، شماره دانشجویی یا ایمیل..."
              aria-label="جستجوی کاربران"
              className="input-field !pr-10"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="فیلتر نقش کاربران"
            className="input-field sm:w-36"
          >
            <option value="">همه</option>
            <option value="ADMIN">مدیر</option>
            <option value="USER">کاربر</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">کاربر</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">ش. دانشجویی</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">ایمیل</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">نقش</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">رزروها</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">وضعیت</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">عملیات</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const fullName = getFullName(user);
                  const statusIsLoading = statusLoadingId === user.id;
                  const anyStatusIsLoading = statusLoadingId !== null;
                  const rolePromotionBlocked = !user.is_active && user.role !== 'ADMIN';
                  const roleActionTitle = rolePromotionBlocked
                    ? 'برای مدیر کردن، ابتدا حساب کاربر را فعال کنید'
                    : `تغییر نقش ${fullName}`;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-line/60 transition-colors hover:bg-surface-alt/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                            <UserCircleIcon aria-hidden="true" className="h-5 w-5 text-ink-faint" />
                          </div>
                          <span className="font-medium text-ink-strong">{fullName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-left text-ink-muted" dir="ltr">
                        {user.student_id}
                      </td>
                      <td className="px-4 py-3 text-left text-xs text-ink-muted" dir="ltr">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={user.role} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {user.reservation_count ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={user.is_active}
                          aria-busy={statusIsLoading}
                          aria-label={`${user.is_active ? 'غیرفعال کردن' : 'فعال کردن'} ${getRoleLabel(user.role)} ${fullName}`}
                          title={user.is_active ? 'غیرفعال کردن حساب' : 'فعال کردن حساب'}
                          disabled={anyStatusIsLoading}
                          onClick={() => toggleStatus(user)}
                          className={`relative inline-flex h-6 w-10 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-60 ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'} ${statusIsLoading ? 'animate-pulse' : ''}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute right-1 top-1 h-4 w-4 rounded-full bg-surface-card shadow-sm transition-transform duration-200 ${user.is_active ? 'translate-x-0' : '-translate-x-4'}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex"
                          title={roleActionTitle}
                        >
                          <Button
                            type="button"
                            onClick={() => setRoleModal(user)}
                            disabled={rolePromotionBlocked || anyStatusIsLoading || roleLoading}
                            variant="icon"
                            size="icon"
                            className={`!h-8 !w-8 !rounded-lg disabled:cursor-not-allowed disabled:opacity-45 ${rolePromotionBlocked ? '!bg-danger-soft !text-danger-ink' : ''}`}
                            aria-label={roleActionTitle}
                          >
                            {rolePromotionBlocked ? (
                              <LockClosedIcon aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <ArrowPathIcon aria-hidden="true" className="h-4 w-4" />
                            )}
                          </Button>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                      کاربری مطابق جستجو یا فیلتر انتخاب‌شده پیدا نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal
        isOpen={Boolean(roleModal)}
        onClose={closeRoleModal}
        title="تغییر نقش کاربر"
        size="sm"
      >
        {roleModal && (
          <div className="text-center">
            <p className="mb-4 text-ink">تغییر نقش کاربر:</p>
            <div className="mb-6 space-y-2 rounded-xl bg-surface-alt p-4">
              <p className="font-bold">{getFullName(roleModal)}</p>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="text-ink-faint">فعلی:</span>
                <Badge status={roleModal.role} />
                <span aria-hidden="true" className="text-ink-subtle">←</span>
                <span className="text-ink-faint">جدید:</span>
                <Badge status={roleModal.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                onClick={closeRoleModal}
                disabled={roleLoading}
                variant="ghost"
                size="md"
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={changeRole}
                disabled={roleLoading}
                variant="primary"
                size="md"
              >
                {roleLoading ? 'در حال تغییر...' : 'تأیید'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
