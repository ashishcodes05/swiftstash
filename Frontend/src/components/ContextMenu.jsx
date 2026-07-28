import { useEffect, useRef } from "react";
import {
  FolderOpen,
  Share2,
  Users,
  Download,
  Trash2,
  Link2,
  Info,
} from "lucide-react";

export function ContextMenu({ state, selectionCount, onAction, onClose }) {
  const ref = useRef(null);

  const items = [
    { type: "item", action: "open", label: "Open", icon: FolderOpen, shortcut: "↵", disabled: selectionCount > 1 },
    { type: "item", action: "rename", label: "Rename", icon: Info, disabled: selectionCount > 1 },
    { type: "item", action: "share", label: "Share", icon: Share2 },
    { type: "item", action: "manage-people", label: "Manage people", icon: Users, disabled: selectionCount > 1 },
    { type: "sep" },
    { type: "item", action: "download", label: "Download", icon: Download, shortcut: "⌘D" },
    { type: "item", action: "copy-link", label: "Copy link", icon: Link2, disabled: selectionCount > 1 },
    { type: "item", action: "details", label: "Details", icon: Info, disabled: selectionCount > 1 },
    { type: "sep" },
    { type: "item", action: "trash", label: "Move to Trash", icon: Trash2, danger: true, shortcut: "⌫" },
  ];

  useEffect(() => {
    const onDocDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    window.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Clamp inside viewport
  const width = 240;
  const height = 340;
  const x = Math.min(state.x, window.innerWidth - width - 8);
  const y = Math.min(state.y, window.innerHeight - height - 8);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 w-60 rounded-xl bg-card-bg/95 backdrop-blur-xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ left: x, top: y, boxShadow: "var(--shadow-menu)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, idx) => {
        // Render separator
        if (it.type === "sep") {
          return <div key={idx} className="my-1 h-px bg-border-subtle" />;
        }

        // Hide disabled items entirely
        if (it.disabled) {
          return null; 
        }

        // Render clickable items
        return (
          <button
            key={it.action}
            role="menuitem"
            onClick={() => onAction(it.action)}
            className={`w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-colors text-left ${
              it.danger
                ? "text-danger hover:bg-danger/10"
                : "text-text-main hover:bg-white/[0.06]"
            }`}
          >
            <it.icon className="w-4 h-4 opacity-90" />
            <span className="flex-1">{it.label}</span>
            {it.shortcut && (
              <span className="text-[11px] text-text-secondary">
                {it.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}