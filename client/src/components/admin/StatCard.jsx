import React from 'react';

/**
 * StatCard component for Admin Dashboard metrics
 * @param {object} props
 * @param {string} props.title - Card title / metric name
 * @param {string|number|null} props.value - Numeric or string value, or null for empty
 * @param {React.ReactNode} props.icon - Lucide icon element
 * @param {string} [props.subtitle] - Optional descriptive subtitle or trend
 * @param {string} [props.colorScheme] - Accent color theme ('indigo', 'blue', 'teal', 'emerald', 'amber', 'purple')
 * @param {boolean} [props.isLoading] - Whether the card is in a loading state
 * @param {string} [props.unavailableMessage] - Message when data is not available ('No data available')
 */
export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  colorScheme = 'indigo',
  isLoading = false,
  unavailableMessage = 'No data available',
}) {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'text-indigo-600',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'text-blue-600',
    },
    teal: {
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
      accent: 'text-teal-600',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-600',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'text-amber-600',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'text-purple-600',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.indigo;
  const isValueAvailable = value !== null && value !== undefined && value !== '';

  return (
    <div className="admin-stat-card bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 flex flex-col justify-between h-full min-h-[144px] sm:min-h-[152px] w-full min-w-0">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate mb-1.5" title={title}>
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg my-1" />
          ) : isValueAvailable ? (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
          ) : (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs sm:text-sm font-medium text-slate-400 italic truncate">
                {unavailableMessage}
              </span>
            </div>
          )}
        </div>

        <div
          className={`admin-stat-icon h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105 ${scheme.iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100/90 flex items-center text-xs text-slate-500 min-w-0">
        <span className="truncate" title={subtitle || ''}>
          {subtitle || 'Platform record metric'}
        </span>
      </div>
    </div>
  );
}
