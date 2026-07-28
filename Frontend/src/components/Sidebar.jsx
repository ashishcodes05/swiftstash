import {
  Cloud,
  FolderOpen,
  Star,
  Clock,
  Users,
  Trash2,
  HardDrive,
  Plus,
  Image as ImageIcon,
  FileText,
  Film,
} from "lucide-react";
import { NavLink, useParams } from "react-router";
import { assets } from "../assets/asset";

const main = [
  { label: "My Drive", icon: FolderOpen, to: "/drive" },
  { label: "Starred", icon: Star, count: 8, to: "/drive/starred" },
  { label: "Recent", icon: Clock, to: "/drive/recent" },
  { label: "Shared with me", icon: Users, count: 3, to: "/drive/shared" },
  { label: "Trash", icon: Trash2, to: "/drive/trash" },
];

const collections = [
  { label: "Photos", icon: ImageIcon, to: "/drive/photos" },
  { label: "Documents", icon: FileText, to: "/drive/documents" },
  { label: "Videos", icon: Film, to: "/drive/videos" },
];

export function Sidebar({ onNewFolderClick }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-800 bg-blue-950/20 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg">
          <img src={assets.logo} alt="SwiftStash" className="h-8 w-8" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">SwiftStash</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-secondary">
            Cloud Storage
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <button 
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-accent px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-transform duration-200 hover:-translate-y-[1px] active:translate-y-0"
          onClick={onNewFolderClick}
        >
          <Plus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 border-b border-gray-800">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {main.map((item) => (
            <NavRow key={item.label} item={item} />
          ))}
        </ul>

        <div className="mt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Collections
        </div>
        <ul className="space-y-0.5">
          {collections.map((item) => (
            <NavRow key={item.label} item={item} />
          ))}
        </ul>
      </nav>

      <div className="m-3 rounded-xl border border-gray-800 bg-card-bg/80 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HardDrive className="h-4 w-4 text-secondary-accent" />
          Storage
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary-accent to-secondary"
            style={{ width: "64%" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
          <span>128 GB of 200 GB</span>
          <button className="text-primary hover:text-secondary-accent transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavRow({ item }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end
        className={({ isActive }) =>
          `group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive
              ? "bg-primary/20 text-text-main"
              : "text-text-secondary hover:bg-white/[0.03] hover:text-text-main"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive
                  ? "text-secondary-accent"
                  : "text-text-secondary group-hover:text-text-main"
              }`}
            />
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.count !== undefined && (
              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                {item.count}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}