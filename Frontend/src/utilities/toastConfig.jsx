import toast from 'react-hot-toast';

// Theme configuration for different toast types
const toastThemes = {
  brand: {
    line: "from-blue-500 to-purple-500",
    iconBg: "from-blue-500/10 to-purple-500/10 border-purple-500/20 text-purple-500 dark:text-purple-400",
    shadow: "shadow-[0_8px_30px_rgba(139,92,246,0.15)]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l3 3 3-3M12 16V9" />
      </svg>
    )
  },
  success: {
    line: "from-emerald-400 to-green-500",
    iconBg: "from-emerald-500/10 to-green-500/10 border-green-500/20 text-green-500 dark:text-green-400",
    shadow: "shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  error: {
    line: "from-rose-400 to-red-500",
    iconBg: "from-rose-500/10 to-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
    shadow: "shadow-[0_8px_30px_rgba(239,68,68,0.15)]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  warning: {
    line: "from-amber-400 to-yellow-500",
    iconBg: "from-amber-500/10 to-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    shadow: "shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
};

export const showStashToast = (title, message, type = 'brand') => {
  // Fallback to 'brand' if an invalid type is passed
  const theme = toastThemes[type] || toastThemes.brand;

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        } transition-all duration-300 ease-out max-w-sm w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl ${theme.shadow} pointer-events-auto flex overflow-hidden relative group`}
      >
        {/* Dynamic Top Gradient Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.line} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

        <div className="flex items-start p-4 w-full">
          {/* Dynamic Icon */}
          <div className="flex-shrink-0 pt-0.5">
            <div className={`h-10 w-10 rounded-full bg-gradient-to-tr flex items-center justify-center border ${theme.iconBg}`}>
              {theme.icon}
            </div>
          </div>

          {/* Text Content */}
          <div className="ml-4 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>

          {/* Dismiss Button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ),
    { duration: type === 'error' ? 6000 : 4000 } // Keep errors on screen a bit longer
  );
};