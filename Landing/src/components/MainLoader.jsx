import React from 'react';

const MainLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 w-full overflow-hidden">
      
      {/* Injecting custom keyframes for the fluid morphing effect */}
      <style>
        {`
          @keyframes liquid-morph {
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          }
          .animate-morph-fast {
            animation: liquid-morph 4s ease-in-out infinite, spin 6s linear infinite;
          }
          .animate-morph-slow {
            animation: liquid-morph 5s ease-in-out infinite reverse, spin 8s linear infinite reverse;
          }
        `}
      </style>

      {/* Morphing Core Container */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-10">
        
        {/* Ambient Glowing Aura */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-40 animate-pulse"></div>

        {/* Layer 1: Background Fluid (Purple leaning) */}
        <div className="absolute inset-2 bg-gradient-to-tr from-purple-600 to-indigo-400 opacity-80 animate-morph-slow mix-blend-multiply dark:mix-blend-screen transition-all"></div>

        {/* Layer 2: Foreground Fluid (Blue leaning) */}
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-400 to-blue-600 opacity-90 animate-morph-fast mix-blend-multiply dark:mix-blend-screen shadow-[inset_0_0_20px_rgba(255,255,255,0.4)]"></div>
        
        {/* The "Stash" Core (Glowing center dot) */}
        <div className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_15px_4px_rgba(255,255,255,0.9)] animate-pulse"></div>
        
      </div>

      {/* Minimal Landing Page Text */}
      <div className="flex flex-col items-center">
        <p className="text-xl font-medium tracking-widest text-gray-800 dark:text-gray-200 animate-pulse">
          Preparing your <span className="font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">digital space</span>...
        </p>
      </div>
      
    </div>
  );
};

export default MainLoader;