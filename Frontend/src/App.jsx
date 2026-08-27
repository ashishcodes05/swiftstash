import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import MiniLoader from "./components/MiniLoader";
import AppLayout from "./components/AppLayout";

const DrivePage = lazy(() => import("./Pages/DrivePage"));
const ManagePeoplePage = lazy(() => import("./Pages/ManagePeoplePage"));
const AccountSettingsPage = lazy(() => import("./Pages/AccountSettingsPage"));

const lazyPage = (Page) => (
  <Suspense fallback={<MiniLoader size="lg" text="Loading your files..." className="text-text-main" />}>
    <Page />
  </Suspense>
);

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
        element: lazyPage(DrivePage),
      },
      {
        path: ":directoryId",
        element: lazyPage(DrivePage),
      },
      {
        path: "manage-people/:fileId",
        element: lazyPage(ManagePeoplePage),
      },
      {
        path: "settings/account",
        element: lazyPage(AccountSettingsPage),
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