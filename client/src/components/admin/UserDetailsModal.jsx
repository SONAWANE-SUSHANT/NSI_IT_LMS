import { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Clock,
  Check,
  AtSign,
  Calendar,
  History,
  UserCog,
  LayoutDashboard,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';
import ConfirmDialog from './ConfirmDialog';
import { fetchUserDevices, removeUserDevice } from '../../services/adminUserService';

export default function UserDetailsModal({ isOpen, user, onClose, onEdit, onViewPortal }) {
  const [devices, setDevices] = useState([]);
  const [activeDeviceCount, setActiveDeviceCount] = useState(0);
  const [maxActiveDevices, setMaxActiveDevices] = useState(2);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState('');
  const [deviceToRemove, setDeviceToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !deviceToRemove) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deviceToRemove]);

  useEffect(() => {
    let cancelled = false;

    const loadDevices = async () => {
      if (!isOpen || !user?.id) return;

      setDevicesLoading(true);
      setDevicesError('');

      try {
        const result = await fetchUserDevices(user.id);
        if (cancelled) return;
        setDevices(result.devices);
        setActiveDeviceCount(result.activeCount);
        setMaxActiveDevices(result.maxActiveDevices);
      } catch (error) {
        if (!cancelled) {
          setDevices([]);
          setActiveDeviceCount(0);
          setDevicesError(error.message || 'Failed to load registered devices.');
        }
      } finally {
        if (!cancelled) setDevicesLoading(false);
      }
    };

    loadDevices();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  const isActive = (user.status || '').toLowerCase() === 'active';
  const isStudent = Number(user.role_id) === 3 || String(user.role || '').toUpperCase() === 'STUDENT';

  const statItems = [
    { label: 'Created', value: formatDate(user.created_at), icon: Calendar },
    { label: 'Last updated', value: formatDate(user.updated_at), icon: History },
    { label: 'Created by', value: user.created_by ? `Admin #${user.created_by}` : 'System', icon: UserCog },
    { label: 'Updated by', value: user.updated_by ? `Admin #${user.updated_by}` : 'System', icon: UserCog },
  ];

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'MOBILE':
        return Smartphone;
      case 'TABLET':
        return Tablet;
      case 'DESKTOP':
        return Monitor;
      default:
        return Laptop;
    }
  };

  const handleConfirmRemoveDevice = async () => {
    if (!deviceToRemove || !user?.id) return;

    setRemoveLoading(true);
    try {
      await removeUserDevice(user.id, deviceToRemove.id);
      setDevices((previous) =>
        previous.map((device) =>
          device.id === deviceToRemove.id
            ? { ...device, status: 'REVOKED' }
            : device
        )
      );
      setActiveDeviceCount((previous) => Math.max(0, previous - 1));
      setDeviceToRemove(null);
    } catch (error) {
      alert(error.message || 'Failed to remove device.');
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
        onClick={onClose}
      >
        <div
          className="relative my-6 flex max-h-[calc(100vh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] sm:max-h-[calc(100vh-48px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-28 shrink-0 overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-100">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full bg-white/70 blur-2xl" />
              <div className="absolute right-[-30px] top-[-50px] h-36 w-36 rounded-full bg-sky-200/50 blur-2xl" />
              <div className="absolute bottom-[-50px] left-[35%] h-32 w-32 rounded-full bg-white/70 blur-2xl" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-500 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-slate-800 active:scale-95"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
            <div className="-mt-9">
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={fullName}
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[linear-gradient(135deg,#7C6AEF_0%,#4F46E5_100%)] text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h2 className="break-words text-2xl font-extrabold text-slate-900">
                  {fullName}
                </h2>

                {isActive && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500"
                    aria-label="Active account"
                  >
                    <Check size={12} strokeWidth={3.5} className="text-white" />
                  </span>
                )}
              </div>

              <p className="mt-1 break-all text-sm font-medium text-slate-500">
                {user.email || `@${user.username}`}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={user.role} size="sm" />
                <StatusBadge status={user.status} size="sm" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {statItems.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3"
                  >
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                      <StatIcon size={14} />
                    </div>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="py-5">
              <div className="mb-3.5">
                <p className="text-base font-bold text-slate-900">Account details</p>
                <p className="mt-1 text-xs text-slate-500">
                  Contact and login information on file.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Email address</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">{user.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                    <AtSign size={16} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Username</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">{user.username}</p>
                  </div>
                </div>
              </div>

              {isStudent && (
                <section className="mt-6 border-t border-slate-100 pt-5">
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-900">Registered Devices</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          <ShieldCheck size={11} />
                          {activeDeviceCount} / {maxActiveDevices}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Active login devices for this student. Administrators can remove a device to free a slot.
                      </p>
                    </div>
                  </div>

                  {devicesLoading ? (
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-8 text-sm text-slate-500">
                      <Loader2 size={17} className="mr-2 animate-spin text-indigo-500" />
                      Loading registered devices...
                    </div>
                  ) : devicesError ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {devicesError}
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-7 text-center">
                      <Laptop size={24} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">No registered devices</p>
                      <p className="mt-1 text-xs text-slate-400">Devices are registered automatically when the student logs in.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {devices.map((device) => {
                        const DeviceIcon = getDeviceIcon(device.device_type);
                        const isDeviceActive = device.status === 'ACTIVE';

                        return (
                          <div
                            key={device.id}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500">
                                <DeviceIcon size={19} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {device.device_name || 'Unknown Device'}
                                  </p>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      isDeviceActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {device.status}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {[device.browser, device.operating_system].filter(Boolean).join(' • ') || 'Device information unavailable'}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  Last active: {formatDateTime(device.last_active_at)}
                                </p>
                              </div>

                              {isDeviceActive && (
                                <button
                                  type="button"
                                  onClick={() => setDeviceToRemove(device)}
                                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-[0.98]"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden sm:inline">Remove Device</span>
                                  <span className="sm:hidden">Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                <Clock size={15} className="mt-0.5 shrink-0 text-sky-400" />
                <p className="text-xs leading-relaxed text-sky-900/70">
                  Account created {formatDateTime(user.created_at)}, last modified {formatDateTime(user.updated_at)}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
            >
              Close
            </button>

            {onViewPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewPortal(user);
                }}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.98] sm:w-auto"
              >
                <LayoutDashboard size={16} />
                <span>View Portal</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98] sm:w-auto"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deviceToRemove)}
        title="Remove Device?"
        message={
          deviceToRemove
            ? `Are you sure you want to remove ${deviceToRemove.device_name || 'this device'} from ${fullName}'s account? The device slot will become available for the student's next login.`
            : ''
        }
        confirmLabel="Remove Device"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={removeLoading}
        onConfirm={handleConfirmRemoveDevice}
        onCancel={() => {
          if (!removeLoading) setDeviceToRemove(null);
        }}
      />
    </>
  );
}
