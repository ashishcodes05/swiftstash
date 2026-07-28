import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  FileArchive, 
  FileVideo, 
  FileAudio, 
  File as FileIcon, 
  Star 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatTimeAgo } from "../utilities/dateFormatter";
import { formatFileSize } from "../utilities/formatFileSize";
import { getFileUiConfig, getReadableFileType } from "../utilities/fileTypes";

export function Row({ item, selected, active, onMouseDown, onDoubleClick, onContextMenu }) {
  const { user } = useAuth();
  const { icon: Icon, colorClass, bgClass } = getFileUiConfig(getReadableFileType(item.type));
  
  const isOwner = item.ownerEmail === user?.email;
  return (
    <div
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={
        "group grid grid-cols-[minmax(0,1fr)_180px_120px_140px] items-center gap-3 px-4 h-12 rounded-lg cursor-pointer select-none border border-transparent transition-colors " +
        (selected
          ? "bg-[color:var(--color-row-selected)] border-[color:var(--color-row-selected-border)]"
          : "hover:bg-[color:var(--color-row-hover)]") +
        (active && !selected ? " ring-1 ring-primary/40" : "")
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* FIX: Removed iconTint from this wrapper div */}
        <div className="w-9 h-9 grid place-items-center rounded-lg border border-gray-800 bg-white/[0.02]">
          {/* FIX: Applied iconTint directly to the Icon here */}
          <Icon className={`w-4.5 h-4.5 ${colorClass} ${bgClass}/10`} />
        </div>
        
        <div className="min-w-0">
          <div className="truncate text-sm text-text-main font-medium flex items-center gap-2">
            {item.name}
            {/* {item.starred && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />} */}
          </div>
          <div className="text-[11px] text-text-secondary">
            {item.type === "directory" ? "Folder" : getReadableFileType(item.type)} · {formatFileSize(item.size) || "-"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {isOwner ? (
          <>
            <img referrerpolicy="no-referrer" src={user?.picture} className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-primary grid place-items-center text-white text-[11px] font-semibold" />
            <span className="text-sm text-text-main">me</span>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-white/10 grid place-items-center text-text-main text-[11px] font-semibold">
              {(item.ownerName ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm text-text-secondary truncate">{item.ownerName}</span>
          </>
        )}
      </div>

      <div className="text-sm text-text-secondary">{formatFileSize(item.size) || "-"}</div>
      <div className="text-sm text-text-secondary">{formatTimeAgo(item.updatedAt)}</div>
    </div>
  );
}

export function FileRow(props) {
  return <Row {...props} />;
}

export function DirectoryRow(props) {
  return <Row {...props} />;
}