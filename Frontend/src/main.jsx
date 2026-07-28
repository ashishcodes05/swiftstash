import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <App />
      <Toaster position="bottom-right" reverseOrder={false} />
    </AuthProvider>
)
