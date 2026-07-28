import React from 'react'
import "./App.css"
import Navbar from './components/Navbar.jsx'
import LandingPage from './pages/LandingPage.jsx'
import FooterSection from './components/FooterSection.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { Outlet } from 'react-router'

const App = () => {
  return (
    <div className='bg-[#0B0F19] text-[#4F46E5] min-h-screen text-center'>
      <Outlet />
    </div>
  )
}

export default App