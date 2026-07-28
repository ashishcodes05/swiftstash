import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Search,
  Bell,
  Settings,
  Upload,
  ChevronDown,
  FileUp,
  FolderUp,
  Sparkles,
  Settings2,
  LogOut,
  ShieldOff,
} from "lucide-react";
import { UploadModal } from "./UploadModal";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosInstance";

const UPLOAD_URL = "http://localhost:3000/api/v1/file/upload";

function uploadOne({ item, parentDirectoryId, onProgress }) {
  let xhrInstance = null;

  const uploadPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrInstance = xhr;

    const fd = new FormData();
    fd.append("file", item.file, item.file.name);
    if (parentDirectoryId) fd.append("parentDirectoryId", parentDirectoryId);
    fd.append("relativePath", item.relativePath);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Aborted"));

    xhr.withCredentials = true;

    xhr.open("POST", UPLOAD_URL);
    console.log(fd.get("file"), fd.get("parentDirectoryId"), fd.get("relativePath"));
    xhr.send(fd);
  });

  return {
    promise: uploadPromise,
    cancel: () => {
      if (xhrInstance) xhrInstance.abort();
    },
  };
}

export function Topbar() {
  const { directoryId } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const abortControllersRef = useRef({});
  const canceledItemsRef = useRef(new Set());
  const runningRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState([]);

  const processQueue = useCallback(
    async (queue) => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        for (const it of queue) {
          if (canceledItemsRef.current.has(it.id)) continue;

          setItems((prev) =>
            prev.map((p) => (p.id === it.id ? { ...p, status: "uploading", progress: 0 } : p))
          );

          try {
            const { promise, cancel } = uploadOne({
              item: it,
              parentDirectoryId: directoryId,
              onProgress: (percent) => {
                setItems((prev) =>
                  prev.map((p) => (p.id === it.id ? { ...p, progress: percent } : p))
                );
              },
            });

            abortControllersRef.current[it.id] = cancel;

            await promise;

            setItems((prev) =>
              prev.map((p) => (p.id === it.id ? { ...p, status: "done", progress: 100 } : p))
            );
          } catch (err) {
            if (err.message === "Aborted") {
              setItems((prev) =>
                prev.map((p) => (p.id === it.id ? { ...p, status: "canceled" } : p))
              );
            } else {
              setItems((prev) =>
                prev.map((p) => (p.id === it.id ? { ...p, status: "error", error: err.message } : p))
              );
            }
          } finally {
            delete abortControllersRef.current[it.id];
          }
        }
      } finally {
        runningRef.current = false;
      }
    },
    [directoryId]
  );

  const handleCancelUpload = (itemId) => {
    if (abortControllersRef.current[itemId]) {
      abortControllersRef.current[itemId]();
    } else {
      canceledItemsRef.current.add(itemId);
      setItems((prev) =>
        prev.map((p) => (p.id === itemId ? { ...p, status: "canceled" } : p))
      );
    }
  };

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newItems = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`,
      file,
      relativePath: file.webkitRelativePath || file.name,
      progress: 0,
      status: "queued",
    }));
    setItems((prev) => [...prev, ...newItems]);
    setModalOpen(true);
    setMenuOpen(false);

    void processQueue(newItems);
  };

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const openSettings = () => {
    closeProfileMenu();
    navigate("/drive/settings/account");
  };

  const handleLogout = async (logoutPath) => {
    closeProfileMenu();
    try {
      await axiosClient.post(logoutPath);
    } catch (error) {
      console.error("Logout request failed:", error.response?.data || error.message);
    } finally {
      setUser(null);
      window.location.href = "http://localhost:5174/login";
    }
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!profileMenuOpen) return;
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  return (
    <>
      <header className="h-16 shrink-0 border-b border-border-subtle bg-background/70 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20 border-gray-800">
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search files, folders, and people"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card-bg/70 border border-gray-800 text-sm text-text-main placeholder:text-text-secondary/70 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-800 text-sm text-text-main hover:bg-card-bg transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-card-bg border border-gray-800 shadow-xl overflow-hidden z-40">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3 h-10 text-sm hover:bg-white/5"
                  >
                    <FileUp className="w-4 h-4 text-text-secondary" /> Upload files
                  </button>
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3 h-10 text-sm hover:bg-white/5"
                  >
                    <FolderUp className="w-4 h-4 text-text-secondary" /> Upload folder
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className="h-10 w-10 grid place-items-center rounded-xl hover:bg-card-bg text-text-secondary hover:text-text-main transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-secondary-accent" />
          </button>
          <button
            onClick={() => navigate("/drive/settings/account")}
            className="h-10 w-10 grid place-items-center rounded-xl hover:bg-card-bg text-text-secondary hover:text-text-main transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div ref={profileMenuRef} className="relative">
            <div
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="h-10 w-10 grid place-items-center rounded-xl hover:bg-card-bg text-text-secondary hover:text-text-main transition-colors cursor-pointer"
            >
              <img referrerpolicy="no-referrer" src={user.picture} alt="Profile" className="h-10 w-10 rounded-full" />
            </div>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30 bg-transparent" onClick={closeProfileMenu} />
                <div className="absolute right-0 mt-3 w-70 overflow-hidden rounded-2xl border border-gray-800 bg-card-bg/95 shadow-2xl shadow-black/30 backdrop-blur-xl z-40">
                  <div className="border-b border-gray-800 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img referrerpolicy="no-referrer" src={user.picture} alt="Profile" className="h-10 w-10 rounded-full" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text-main">
                          {user?.name || "User"}
                        </div>
                        <div className="truncate text-xs text-text-secondary">
                          {user?.email || "Signed in account"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        closeProfileMenu();
                        navigate("/drive/settings/account#pro-upgrade");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-sm text-text-main hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/15 text-secondary-accent">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">Upgrade to Pro</span>
                      </span>
                    </button>

                    <button
                      onClick={openSettings}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-sm text-text-main hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.03] text-text-main">
                        <Settings2 className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">Settings</span>
                      </span>
                    </button>

                    <div className="my-2 h-px bg-gray-800" />

                    <button
                      onClick={() => handleLogout("/auth/logout")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-sm text-text-main hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.03] text-text-main">
                        <LogOut className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">Logout from this device</span>
                      </span>
                    </button>

                    <button
                      onClick={() => handleLogout("/auth/logout-all-devices")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-danger/10 text-danger">
                        <ShieldOff className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">Logout from all devices</span>
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </header>

      {modalOpen && (
        <UploadModal
          items={items}
          onClose={() => setModalOpen(false)}
          onClear={() => setItems([])}
          onCancel={handleCancelUpload}
        />
      )}
    </>
  );
}