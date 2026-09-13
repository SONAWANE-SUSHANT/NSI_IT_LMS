import { Inbox } from 'lucide-react';

/**
 * Reusable EmptyState component
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.actionLabel]
 * @param {Function} [props.onAction]
 */
export default function EmptyState({
  title = 'No records found',
  description = 'No data matching the selected criteria is available.',
  icon,
  actionLabel,
  onAction,
}) {
  const renderIcon = () => {
    if (!icon) return <Inbox size={28} className="text-slate-400" />;
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent size={28} className="text-slate-400" />;
    }
    return icon;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
        {renderIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
