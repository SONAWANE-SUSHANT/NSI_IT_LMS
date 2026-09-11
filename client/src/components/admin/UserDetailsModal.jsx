import { useEffect } from 'react';
import { X, Mail, Clock, Check, AtSign, Smartphone, Calendar, History, UserCog, LayoutDashboard } from 'lucide-react';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';

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
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

            {/* Device */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                <Smartphone size={16} className="text-slate-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Device code
                </p>

                <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-700">
                  {user.device_code || "No device linked"}
                </p>
              </div>
            </div>
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
