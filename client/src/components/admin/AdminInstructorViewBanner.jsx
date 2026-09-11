import { Eye, ArrowLeft, ShieldAlert } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * Admin viewing banner displayed prominently when an admin is inspecting an instructor's portal.
 * @param {object} props
 * @param {object} props.instructor - The instructor being viewed
 * @param {Function} props.onReturnToAdmin - Callback to return to Admin Portal and clear viewing context
 */
export default function AdminInstructorViewBanner({ instructor, onReturnToAdmin }) {
  if (!instructor) return null;

  const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username;

  return (
    <aside
      aria-label="Admin View Mode Notification"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md border-b border-amber-600/30 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 text-white shadow-xs shrink-0">
            <Eye size={16} className="animate-pulse" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="font-extrabold uppercase tracking-wide text-[11px] px-2 py-0.5 rounded bg-black/25 text-amber-100 shrink-0">
              Admin View Mode
            </span>
            <span className="text-amber-100 font-medium">Viewing Portal for:</span>
            <strong className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {fullName}
            </strong>
            <span className="text-amber-200 text-xs hidden md:inline">
              (@{instructor.username})
            </span>
            {instructor.status && (
              <span className="hidden sm:inline-flex">
                <StatusBadge status={instructor.status} size="sm" />
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToAdmin}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-amber-50 active:bg-amber-100 font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft size={14} className="text-slate-700" />
          <span>Return to Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
