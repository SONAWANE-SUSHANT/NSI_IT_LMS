import { Search, X, Loader2 } from 'lucide-react';

/**
 * Reusable SearchBar component
 * @param {object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Input change callback
 * @param {Function} [props.onClear] - Clear button callback
 * @param {string} [props.placeholder] - Custom placeholder text
 * @param {boolean} [props.isLoading] - Loading state
 */
export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search by name, username, or email...',
  isLoading = false,
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3.5 pointer-events-none text-slate-400">
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-indigo-600" />
        ) : (
          <Search size={18} />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-2xs min-h-[38px]"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
