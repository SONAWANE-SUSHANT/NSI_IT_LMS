import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Clock,
  Check,
  AtSign,
  Smartphone,
  Calendar,
  History,
  UserCog,
  LayoutDashboard,
  Laptop,
  Monitor,
  Tablet,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';
import { fetchUserDevices, removeUserDevice } from '../../services/adminUserService';

/**
 * UserDetailsModal component for inspecting user profile and audit info
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {object|null} props.user
 * @param {Function} props.onClose
 * @param {Function} [props.onEdit]
 * @param {Function} [props.onViewPortal]
 */
export default function UserDetailsModal({ isOpen, user, onClose, onEdit, onViewPortal }) {
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState(null);
  const [deviceError, setDeviceError] = useState('');

  const loadDevices = async () => {
    if (!user?.id) return;
    try {
      setLoadingDevices(true);
      setDeviceError('');
      const data = await fetchUserDevices(user.id);
      setDevices(data || []);
    } catch (err) {
      setDeviceError(err.message || 'Failed to load registered devices');
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadDevices();
    } else {
      setDevices([]);
      setDeviceError('');
    }
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const handleRemoveDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to remove and revoke this device? This will immediately free up one active device slot for this student.')) {
      return;
    }
    try {
      setRemovingDeviceId(deviceId);
      setDeviceError('');
      await removeUserDevice(user.id, deviceId);
      await loadDevices();
    } catch (err) {
      setDeviceError(err.message || 'Failed to remove device');
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'MOBILE':
        return <Smartphone size={18} className="text-indigo-600" />;
      case 'TABLET':
        return <Tablet size={18} className="text-indigo-600" />;
      case 'DESKTOP':
        return <Monitor size={18} className="text-indigo-600" />;
      case 'LAPTOP':
      default:
        return <Laptop size={18} className="text-indigo-600" />;
    }
  };

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
  const isStudent = (user.role && (user.role === 'student' || user.role.name === 'STUDENT' || user.role === 'STUDENT')) || user.role_id === 3;
  const activeDevicesCount = devices.filter((d) => d.status === 'ACTIVE').length;

  const statItems = [
    { label: 'Created', value: formatDate(user.created_at), icon: Calendar },
    { label: 'Last updated', value: formatDate(user.updated_at), icon: History },
    { label: 'Created by', value: user.created_by ? `Admin #${user.created_by}` : 'System', icon: UserCog },
    { label: 'Updated by', value: user.updated_by ? `Admin #${user.updated_by}` : 'System', icon: UserCog },
  ];


return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
    onClick={onClose}
  >
    <div
      className="relative my-6 flex max-h-[calc(100vh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] sm:max-h-[calc(100vh-48px)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header cover */}
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

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
        {/* Avatar */}
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

        {/* Identity */}
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

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <RoleBadge role={user.role} size="sm" />
            <StatusBadge status={user.status} size="sm" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat, index) => {
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

        {/* Account details */}
        <div className="py-5">
          <div className="mb-3.5">
            <p className="text-base font-bold text-slate-900">
              Account details
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Contact and login information on file.
            </p>
          </div>

          <div className="space-y-2">
            {/* Email */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                <Mail size={16} className="text-slate-400" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Email address
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                  {user.email || "-"}
                </p>
              </div>
            </div>

            {/* Username */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                <AtSign size={16} className="text-slate-400" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Username
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                  {user.username}
                </p>
              </div>
            </div>

          </div>

          {/* Registered Devices (Student 2-Device Limit Management) */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-slate-900">
                    Registered Devices
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    activeDevicesCount >= 2 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {activeDevicesCount}/2 Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Auto-registered on student login. Max 2 active devices permitted.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDevices}
                disabled={loadingDevices}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition-colors p-1 rounded-lg hover:bg-slate-100"
                title="Refresh devices"
              >
                <RefreshCw size={14} className={loadingDevices ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {deviceError && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{deviceError}</span>
              </div>
            )}

            {loadingDevices && devices.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-xs text-slate-400">
                <RefreshCw size={16} className="mr-2 animate-spin text-indigo-500" />
                Loading registered devices...
              </div>
            ) : devices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                <Smartphone size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No registered devices</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Devices are registered automatically when the student logs in from a phone, tablet, or computer.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map((device) => {
                  const isActiveDevice = device.status === 'ACTIVE';
                  const isRemoving = removingDeviceId === device.id;

                  return (
                    <div
                      key={device.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 shadow-sm transition-all ${
                        isActiveDevice
                          ? 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md'
                          : 'border-slate-100 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                          isActiveDevice
                            ? 'border-indigo-100 bg-indigo-50/70 text-indigo-600'
                            : 'border-slate-200 bg-slate-100 text-slate-400'
                        }`}>
                          {getDeviceIcon(device.device_type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {device.device_name || `${device.device_type || 'Unknown'} Device`}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isActiveDevice
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {device.status}
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {[
                              device.browser,
                              device.operating_system,
                              device.last_ip_address ? `IP: ${device.last_ip_address}` : null
                            ].filter(Boolean).join(' • ')}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Last active: {formatDateTime(device.last_active_at || device.last_login_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center self-end sm:self-center shrink-0">
                        {isActiveDevice ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveDevice(device.id)}
                            disabled={isRemoving}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50 active:scale-95"
                            title="Revoke device access and free up active slot"
                          >
                            <Trash2 size={13} className={isRemoving ? 'animate-pulse' : ''} />
                            <span>{isRemoving ? 'Removing...' : 'Remove Device'}</span>
                          </button>
                        ) : (
                          <span className="text-xs italic text-slate-400 px-2 py-1">
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
            <Clock
              size={15}
              className="mt-0.5 shrink-0 text-sky-400"
            />

            <p className="text-xs leading-relaxed text-sky-900/70">
              Account created {formatDateTime(user.created_at)}, last modified{" "}
              {formatDateTime(user.updated_at)}.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
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
);
}
