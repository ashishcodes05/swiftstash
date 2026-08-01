import { useState, useRef, useEffect } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export function Breadcrumb({ path = [], onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navigateTo = (id) => {
    if (typeof onNavigate === 'function') {
      onNavigate(id);
    }
  };

  // Close the dropdown if the user clicks anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!path || path.length === 0) return null;

  // SCENARIO 1: 3 or fewer levels. Render all folders inline.
  if (path.length <= 3) {
    return (
      <div className="flex items-center text-sm font-medium text-text-main">
        {path.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-text-secondary" />}
            <button
              onClick={() => navigateTo(item.id)}
              className={`hover:bg-card-bg px-2 py-1 rounded-md transition-colors text-lg truncate max-w-[150px] ${
                index === path.length - 1 
                  ? 'text-text-main pointer-events-none' // Current folder is not clickable
                  : 'text-text-secondary hover:text-text-main'
              }`}
              title={item.name}
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // SCENARIO 2: More than 3 levels. Activate the collapse menu.
  const firstFolder = path[0];
  const currentFolder = path[path.length - 1];
  const nestedHiddenFolders = path.slice(1, -1); // Extracts everything in the middle

  return (
    <div className="flex items-center text-sm font-medium text-text-main">
      
      {/* 1. Always show the Root folder (My Drive) */}
      <button
        onClick={() => navigateTo(firstFolder.id)}
        className="text-text-secondary hover:text-text-main text-lg hover:bg-card-bg px-2 py-1 rounded-md transition-colors"
      >
        {firstFolder.name}
      </button>

      <ChevronRight className="w-4 h-4 mx-1 text-text-secondary" />

      {/* 2. The Dynamic Dropdown Menu */}
      <div className="relative flex items-center" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-1 rounded-md hover:bg-card-bg transition-colors flex items-center justify-center ${
            isMenuOpen ? 'bg-card-bg text-text-main' : 'text-text-secondary'
          }`}
          title="Show hidden folders"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* The floating menu that opens on click */}
        {isMenuOpen && (
          <div
            className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-white/10 bg-background/70 backdrop-blur-xl py-1.5 z-50"
            style={{ boxShadow: 'var(--shadow-menu)' }}
          >
            {nestedHiddenFolders.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigateTo(item.id);
                  setIsMenuOpen(false); // Close menu after navigation
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-main hover:bg-white/8 transition-colors truncate block"
                title={item.name}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 mx-1 text-text-secondary" />

      {/* 3. Always show the Current Folder */}
      <div className="px-2 py-1 truncate max-w-[200px] text-lg" title={currentFolder.name}>
        {currentFolder.name}
      </div>
      
    </div>
  );
}