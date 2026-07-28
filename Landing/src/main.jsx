import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router";
import LandingPage from './pages/LandingPage.jsx';
import FooterSection from './components/FooterSection.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainLoader from './components/MainLoader.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <App />
            <Toaster position="bottom-right" reverseOrder={false} />
          </AuthProvider>
      </GoogleOAuthProvider>
    ),
    children: [
      {
        index: true,
        element: <>
          <LandingPage />
          <FooterSection />
        </>,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      }, 
      { 
        path: "/loader",
        element: <MainLoader />,
      }
    ]
  },
]);

createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
