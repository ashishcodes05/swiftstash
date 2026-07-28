import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, LayoutGrid, List as ListIcon, SlidersHorizontal } from "lucide-react";
import { FileRow } from "../components/Row";
import { ContextMenu } from "../components/ContextMenu";
import { deleteDirectory, deleteMultipleDirectories, getDirectoryContents, renameDirectory } from "../api/directoryService";
import MiniLoader from "../components/MiniLoader";
import { deleteFile, deleteMultipleFiles } from "../api/fileService";
import { RenameModal } from "../components/RenameModal";

export default function DrivePage() {
  const { directoryId } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [activeId, setActiveId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [renameModalItem, setRenameModalItem] = useState(null);

  const handleMouseDown = (item) => (e) => {
    if (e.button === 2) return;
    setMenu(null);
    setActiveId(item.id);

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setIsBulkMode(true);
    } else {
      setIsBulkMode(false);
    }

    setSelected((prev) => {
      const next = new Set(prev);
      if (e.ctrlKey || e.metaKey) {
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
      } else if (e.shiftKey && activeId) {
        const allItems = [...directories, ...files];
        const ids = allItems.map((d) => d.id);
        const a = ids.indexOf(activeId);
        const b = ids.indexOf(item.id);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        for (let i = lo; i <= hi; i++) next.add(ids[i]);
      } else {
        next.clear();
        next.add(item.id);
      }
      return next;
    });
  };

  const handleContextMenu = (item) => (e) => {
    e.preventDefault();
    setSelected((prev) => {
      if (prev.has(item.id)) return prev;
      return new Set([item.id]);
    });
    setActiveId(item.id);
    setIsBulkMode(false);
    setMenu({ x: e.clientX, y: e.clientY, targetId: item.id });
  };

  const handleSingleDownload = (fileId) => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/file/${fileId}?action=download`;
  };

  const handleOpenFile = (fileId) => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/file/${fileId}`;
  }

  const handleOpenDirectory = (directoryId) => {
    navigate(`/drive/${directoryId}`);
  };

  const handleBulkDownload = (selectedItems) => {
    const formattedItems = selectedItems.map((item) => ({
      id: item.id,
      type: item.type == "directory" ? "directory" : "file",
    }));
    
    const form = document.createElement("form");
    form.method = "POST";
    form.action = import.meta.env.VITE_BULK_DOWNLOAD_URL;
    form.style.display = "none";

    const itemsInput = document.createElement("input");
    itemsInput.type = "hidden";
    itemsInput.name = "items";
    itemsInput.value = JSON.stringify(formattedItems);
    form.appendChild(itemsInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleSingleDelete = async(targetItem) => {
    try {
      if(targetItem.type === "directory") {
        const response = await deleteDirectory(targetItem.id);
        if(response.success) {
          setDirectories((prev) => prev.filter((dir) => dir.id !== targetItem.id));
        }
      } else {
        const response = await deleteFile(targetItem.id);
        if(response.success) {
          setFiles((prev) => prev.filter((file) => file.id !== targetItem.id));
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleBulkDelete = async (selectedItems) => {
    try {
      const directoryIds = selectedItems.filter(item => item.type === "directory").map(item => item.id);
      const fileIds = selectedItems.filter(item => item.type !== "directory").map(item => item.id);

      if (directoryIds.length > 0) {
        await deleteMultipleDirectories(directoryIds);
      }
      if (fileIds.length > 0) {
        console.log("Deleting files:", fileIds);
        await deleteMultipleFiles(fileIds);
      }

      setDirectories((prev) => prev.filter((dir) => !directoryIds.includes(dir.id)));
      setFiles((prev) => prev.filter((file) => !fileIds.includes(file.id)));
    } catch (error) {
      console.error("Error deleting items:", error);
    }
  };

  const handleAction = (action, overrideId) => {
    const targetId = overrideId || menu?.targetId;
    const ids = selected.size > 0 ? Array.from(selected) : targetId ? [targetId] : [];
    setMenu(null);

    switch (action) {
      case "open": {
        if (targetId) {
          const item = [...files, ...directories].find(i => i.id === targetId);
          if (item) {
            console.log("Opening item:", item);
            if (item.type === "directory") {
              handleOpenDirectory(targetId);
            } else {
              handleOpenFile(targetId);
            }
          }
        }
        break;
      }
      case "manage-people": {
        if (targetId) navigate(`/manage-people/${targetId}`);
        break;
      }
      case "download": {
        if (ids.length === 1) {
          const singleItem = [...files, ...directories].find(i => i.id === ids[0]);
          if (singleItem?.type !== "directory") {
            handleSingleDownload(ids[0]);
            break;
          }
        }
        
        if (ids.length > 0) {
          const selectedItems = [...files, ...directories].filter(item => ids.includes(item.id));
          handleBulkDownload(selectedItems);
        }
        break;
      }
      case "rename": { // Assuming you add this to your ContextMenu
        const targetItem = [...files, ...directories].find(i => i.id === targetId);
        if (targetItem) {
          setRenameModalItem(targetItem);
        }
        break;
      }
      case "share":
      case "copy-link":
      case "details":
        console.log(action, ids);
        break;
      case "trash":
        setSelected(new Set());
        setIsBulkMode(false);
        if (ids.length === 1) {
          const singleItem = [...files, ...directories].find(i => i.id === ids[0]);
          if (singleItem) {
            handleSingleDelete(singleItem);
          }
        } else if (ids.length > 1) {
          const selectedItems = [...files, ...directories].filter(item => ids.includes(item.id));
          handleBulkDelete(selectedItems);
        }
        break;
    }
  };

  const clearSelection = (e) => {
    if (e.target === e.currentTarget) {
      setSelected(new Set());
      setMenu(null);
      setIsBulkMode(false);
    }
  };

  const fetchDirectoryContents = useCallback(async() => {
    setLoading(true);
    try {
      const response = await getDirectoryContents(directoryId);
      if(response.success) {
        setFiles(response.data.files);
        setDirectories(response.data.directories);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [directoryId]);

  useEffect(() => {
    fetchDirectoryContents();
  }, [fetchDirectoryContents]);
  
  if(loading) return <MiniLoader size="lg" text="Loading your files..." className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />;
  
  return (
    <>
      <main className="flex-1 overflow-y-auto" onMouseDown={clearSelection}>
        <div className="relative max-w-[1400px] mx-auto px-6 py-6">
            <div className="sticky top-0 z-10 pb-4 mb-6 bg-background backdrop-blur-md -mx-6 px-6 pt-6 -mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    <span>Swiftstash</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-text-main">My Drive</span>
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight">My Drive</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-9 px-3 rounded-lg border border-gray-800 text-sm text-text-secondary hover:text-text-main hover:bg-card-bg inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </button>
                  <div className="flex rounded-lg border border-gray-800 overflow-hidden">
                    <button className="h-9 w-9 grid place-items-center bg-card-bg text-text-main">
                      <ListIcon className="w-4 h-4" />
                    </button>
                    <button className="h-9 w-9 grid place-items-center text-text-secondary hover:text-text-main hover:bg-card-bg">
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {(selected.size > 1 || (selected.size === 1 && isBulkMode)) && (
                <div className="mt-4 flex items-center justify-between px-4 h-11 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-sm">
                    <span className="font-semibold">{selected.size}</span>{" "}
                    <span className="text-text-secondary">
                      item{selected.size > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction("download")}
                      className="h-8 px-3 rounded-md text-sm bg-white/5 hover:bg-white/10 transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleAction("trash")}
                      className="h-8 px-3 rounded-md text-sm bg-danger/15 text-danger hover:bg-danger/25 transition"
                    >
                      Move to Trash
                    </button>
                    <button
                      onClick={() => {
                        setSelected(new Set());
                        setIsBulkMode(false);
                      }}
                      className="h-8 px-3 rounded-md text-sm text-text-secondary hover:text-text-main"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_180px_120px_140px] gap-3 px-4 pb-2 text-[11px] uppercase tracking-widest text-text-secondary/70">
              <div>Name</div>
              <div>Owner</div>
              <div>Size</div>
              <div>Modified</div>
            </div>

            {directories?.length > 0 && (
              <section className="mb-6">
                <div className="space-y-1">
                  {directories.map((item) => (
                    <FileRow
                      key={item.id}
                      item={item}
                      selected={selected.has(item.id)}
                      active={activeId === item.id}
                      onMouseDown={handleMouseDown(item)}
                      onDoubleClick={() => handleAction("open", item.id)}
                      onContextMenu={handleContextMenu(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="space-y-1 pb-24">
                {files?.map((item) => (
                  <FileRow
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    active={activeId === item.id}
                    onMouseDown={handleMouseDown(item)}
                    onDoubleClick={() => handleAction("open", item.id)}
                    onContextMenu={handleContextMenu(item)}
                  />
                ))}
              </div>
            </section>
        </div>
      </main>

      {menu && (
        <ContextMenu
          state={menu}
          selectionCount={selected.size}
          onAction={handleAction}
          onClose={() => setMenu(null)}
        />
      )}
      {renameModalItem && (
        <RenameModal
          item={renameModalItem}
          onClose={() => setRenameModalItem(null)}
          onSuccess={() => {
            fetchDirectoryContents(); // Instantly refresh the UI!
          }}
        />
      )}
    </>
  );
}