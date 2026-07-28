import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import DrivePage from "./Pages/DrivePage"; // Adjust path if it's in a /pages folder
import ManagePeoplePage from "./Pages/ManagePeoplePage";
import AccountSettingsPage from "./Pages/AccountSettingsPage";
import MiniLoader from "./components/MiniLoader";
import AppLayout from "./components/AppLayout";

const comingSoonPage = (label) => (
  <main className="flex-1 overflow-y-auto">
    <div className="h-full w-full flex items-center justify-center bg-background text-text-main">
      {label} - Coming Soon
    </div>
  </main>
);

// Define our route tree
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/drive" replace />,
  },
  {
    path: "/drive",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DrivePage />,
      },
      {
        path: ":directoryId",
        element: <DrivePage />,
      },
      {
        path: "manage-people/:fileId",
        element: <ManagePeoplePage />,
      },
      {
        path: "settings/account",
        element: <AccountSettingsPage />,
      },
      // Placeholders for the other sidebar links so they don't crash when clicked
      {
        path: "shared",
        element: comingSoonPage("Shared with me"),
      },
      {
        path: "starred",
        element: comingSoonPage("Starred"),
      },
      {
        path: "recent",
        element: comingSoonPage("Recent"),
      },
      {
        path: "people",
        element: comingSoonPage("People"),
      },
      {
        path: "trash",
        element: comingSoonPage("Trash"),
      },
    ],
  },
  {
    path: "/mini-loader",
    element: <MiniLoader size="lg" text="Loading..." className="text-text-main" />,
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}