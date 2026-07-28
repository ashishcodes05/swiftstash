import { useState, useEffect, useRef } from "react";
import { X, FolderPlus } from "lucide-react";
import axiosClient from "../api/axiosInstance";
import { createDirectory } from "../api/directoryService";

export function NewFolderModal({ currentDirectoryId, onClose, onSuccess }) {
  const [folderName, setFolderName] = useState("Untitled folder");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus and highlight "Untitled folder" immediately on mount
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError("Folder name cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Adjust this route to match your Express backend!
      const response = await createDirectory(currentDirectoryId, trimmedName);

      if (response?.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create folder");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-card-bg shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <div className="flex items-center gap-2 text-text-main">
              <FolderPlus className="h-5 w-5 text-text-secondary" />
              <h2 className="text-sm font-semibold tracking-wide">New folder</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-text-secondary hover:bg-white/5 hover:text-text-main transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Folder name"
                className="h-10 w-full rounded-xl border border-gray-700 bg-background/50 px-3 text-sm text-text-main outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              {error && (
                <p className="mt-2 text-xs text-danger">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 rounded-lg px-4 text-sm font-medium text-text-main hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !folderName.trim()}
                className="h-9 rounded-lg bg-primary/20 px-4 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}