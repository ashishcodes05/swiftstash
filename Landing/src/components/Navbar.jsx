import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets.js';
import { HelpCircle, Coins, LogIn, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  // Add a scroll listener to detect when the user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? "bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5 shadow-lg" 
          : "bg-transparent border-transparent"
      }`}
    >
      {/* 
        Changed to 'fixed' so the hero section flows underneath it. 
        Dynamic classes apply the background/border ONLY when scrolled.
      */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-1.5">
            <img src={assets.logo} alt="SwiftStash Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[#1467FF] font-bold text-2xl tracking-tight">
            Swift<span className="text-purple-500">Stash</span>
          </h1>
        </button>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-[#9CA3AF]">
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group">
            <Zap className="w-4 h-4 group-hover:text-primary transition-colors" /> Features
          </li>           
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group">
            <HelpCircle className="w-4 h-4 group-hover:text-primary transition-colors" /> How it works
          </li>
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group">
            <Coins className="w-4 h-4 group-hover:text-primary transition-colors" /> Pricing
          </li>
        </ul>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Login <LogIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="hidden sm:flex items-center gap-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg shadow-[0_0_15px_rgba(20,103,255,0.3)] transition-all hover:-translate-y-0.5"
          >
            Sign Up
          </button>
        </div>
        
      </nav>
    </header>
  );
};

export default Navbar;