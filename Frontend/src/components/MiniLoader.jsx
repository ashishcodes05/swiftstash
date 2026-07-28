import React from 'react';

const MiniLoader = ({ size = 'md', text, className = '' }) => {
  // Configurable sizes for different contexts
  const sizeClasses = {
    sm: 'w-4 h-4',   // Best inside small buttons or dense lists
    md: 'w-5 h-5',   // Best for standard inline text replacement
    lg: 'w-7 h-7'    // Best for replacing a whole card or file row
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex-shrink-0 ${sizeClasses[size]}`}>
        {/* Subtle background track */}
        <svg
          className="absolute inset-0 w-full h-full text-gray-700/30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        </svg>

        {/* Spinning gradient arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="swiftstash-mini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" /> {/* primary / bright blue */}
              <stop offset="100%" stopColor="#8B5CF6" /> {/* secondary / vibrant purple */}
            </linearGradient>
          </defs>
          <path
            d="M12 2C6.477 2 2 6.477 2 12"
            stroke="url(#swiftstash-mini-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Optional loading text next to the spinner */}
      {text && (
        <span className="text-sm font-medium text-text-secondary animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export default MiniLoader;