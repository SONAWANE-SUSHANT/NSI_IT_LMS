import React, { useState } from 'react';

/**
 * Reusable StarRating Component
 * Supports read-only display or interactive integer selection (1-5 stars)
 */
export default function StarRating({
  rating = 0,
  maxStars = 5,
  interactive = false,
  onChange = () => {},
  size = 'md',
  showValue = false,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;
  const currentRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const handleStarClick = (starIndex) => {
    if (!interactive) return;
    const selected = Math.max(1, Math.min(maxStars, Math.round(starIndex)));
    onChange(selected);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => interactive && setHoverRating(0)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starNumber = i + 1;
          const isFilled = starNumber <= Math.round(currentRating);

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(starNumber)}
              onMouseEnter={() => interactive && setHoverRating(starNumber)}
              aria-label={`${starNumber} star${starNumber > 1 ? 's' : ''}`}
              className={`transition-all duration-150 transform ${
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-sm'
                  : 'cursor-default pointer-events-none'
              }`}
            >
              <svg
                className={`${starSize} ${
                  isFilled
                    ? 'text-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.4)]'
                    : 'text-gray-300 dark:text-gray-600'
                } transition-colors duration-150`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
