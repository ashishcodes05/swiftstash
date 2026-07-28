import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, FileIcon, XCircle } from "lucide-react";

function CircularProgress({ progress, status }) {
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - progress / 100);

  if (status === "done") {
    return <CheckCircle2 className="w-9 h-9 text-emerald-400" />;
  }
  if (status === "error") {
    return <AlertCircle className="w-9 h-9 text-danger" />;
  }
  if (status === "canceled") {
    return <XCircle className="w-9 h-9 text-text-secondary/50" />;
  }

  return (
    <div className="relative w-9 h-9">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#22c55e"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-emerald-300">
        {status === "queued" ? <Loader2 className="w-3 h-3 animate-spin" /> : `${Math.round(progress)}`}
      </div>
    </div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UploadModal({ items, onClose, onClear, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = items.filter((i) => i.status === "done").length;
  const uploading = items.some((i) => i.status === "uploading" || i.status === "queued");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 pointer-events-none">
      <div className="w-full sm:w-[420px] max-h-[70vh] flex flex-col rounded-2xl bg-card-bg border border-border-subtle shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle">
          <div className="text-sm font-semibold">
            {uploading ? "Uploading" : "Uploads"}{" "}
            <span className="text-text-secondary font-normal">
              ({done}/{items.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!uploading && items.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-text-secondary hover:text-text-main px-2 h-7 rounded-md hover:bg-white/5"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 grid place-items-center rounded-md text-text-secondary hover:text-text-main hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="p-6 text-center text-sm text-text-secondary">No uploads yet.</div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <div className="shrink-0 w-9 h-9 grid place-items-center rounded-lg bg-white/5">
                <FileIcon className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text-main truncate">{item.relativePath}</div>
                <div className="text-xs text-text-secondary">
                  {formatSize(item.file.size)}
                  {item.status === "error" && item.error && (
                    <span className="text-danger"> · {item.error}</span>
                  )}
                  {item.status === "uploading" && <span> · {Math.round(item.progress)}%</span>}
                  {item.status === "queued" && <span> · Queued</span>}
                  {item.status === "done" && <span className="text-emerald-400"> · Uploaded</span>}
                  {item.status === "canceled" && <span className="text-text-secondary"> · Canceled</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(item.status === "uploading" || item.status === "queued") && onCancel && (
                  <button
                    onClick={() => onCancel(item.id)}
                    className="w-7 h-7 grid place-items-center rounded-full text-text-secondary hover:text-text-main hover:bg-white/10 transition-colors"
                    title="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <CircularProgress progress={item.progress} status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}