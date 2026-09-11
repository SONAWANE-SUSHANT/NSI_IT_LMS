import { Eye, ArrowLeft } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * Admin viewing banner displayed prominently when an admin is inspecting a student's portal.
 * @param {object} props
 * @param {object} props.student - The student being viewed
 * @param {Function} props.onReturnToAdmin - Callback to return to Admin Portal and clear viewing context
 */
export default function AdminStudentViewBanner({ student, onReturnToAdmin }) {
  if (!student) return null;

  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username;

  return (
    <aside
      aria-label="Admin Student View Mode Notification"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-md border-b border-teal-700/30 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 text-white shadow-xs shrink-0">
            <Eye size={16} className="animate-pulse" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="font-extrabold uppercase tracking-wide text-[11px] px-2 py-0.5 rounded bg-black/25 text-teal-100 shrink-0">
              Admin View Mode
            </span>
            <span className="text-teal-100 font-medium">Viewing Learner Portal for:</span>
            <strong className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {fullName}
            </strong>
            <span className="text-teal-200 text-xs hidden md:inline">
              (@{student.username})
            </span>
            {student.status && (
              <span className="hidden sm:inline-flex">
                <StatusBadge status={student.status} size="sm" />
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToAdmin}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-teal-50 active:bg-teal-100 font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft size={14} className="text-slate-700" />
          <span>Return to Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
