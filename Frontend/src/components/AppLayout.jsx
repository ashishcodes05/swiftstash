import { Outlet, useParams } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NewFolderModal } from "./NewFolderModal";
import { useState } from "react";

export default function AppLayout() {
  const { directoryId } = useParams();
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  return (
    <div className="flex h-screen w-full bg-background text-text-main">
      <Sidebar onNewFolderClick={() => setNewFolderModalOpen(true)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <Outlet />
      </div>
      {newFolderModalOpen && (
        <NewFolderModal
          currentDirectoryId={directoryId}
          onClose={() => setNewFolderModalOpen(false)}
          onSuccess={() => {
            console.log("Folder created! Refresh the UI.");
          }}
        />
      )}
    </div>
  );
}
