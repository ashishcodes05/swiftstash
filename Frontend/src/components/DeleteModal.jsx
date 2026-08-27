import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export function DeleteModal({ items, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const itemCount = items.length;
  const hasFolder = items.some((item) => item.type === "directory");
  const itemLabel = itemCount === 1 ? (hasFolder ? "folder" : "file") : "items";

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (deleteError) {
      setError(deleteError?.response?.data?.error || deleteError?.message || "Could not delete the selected items.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-70 grid place-items-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-card-bg shadow-2xl">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-2 text-text-main">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <h2 className="text-sm font-semibold">Delete {itemLabel}?</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-main disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close delete dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-5">
            <p className="text-sm text-text-secondary">
              {itemCount === 1
                ? `This ${itemLabel} and its stored data will be deleted permanently.`
                : `${itemCount} selected items and their stored data will be deleted permanently.`}
            </p>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="h-9 rounded-lg px-4 text-sm font-medium text-text-main transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex h-9 min-w-28 items-center justify-center gap-2 rounded-lg bg-danger/15 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
