import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowLeft, ArrowRight, CheckCircle2, Hexagon, Sparkles, UserPlus, Loader2, User } from 'lucide-react';
import { assets } from '../assets/assets';
import { Link, useNavigate } from 'react-router';
import { useGoogleLogin } from '@react-oauth/google';
import axiosClient from '../api/axiosInstance';
import { showStashToast } from '../utilities/toastConfig';
import { postGoogleAuthCode } from '../api/googleAuth.js';
import { getMainAppDriveUrl } from '../config/navigation.js';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear specific error as user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required.';
      }
        
      if (!formData.email) {
        newErrors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        setIsLoading(true);
        // Request OTP for registration
        await axiosClient.post("/auth/send-otp", { email: formData.email }); 
        
        showStashToast("Code Sent", "Check your inbox for the verification code.", "success");
        setStep(2);
      } catch (error) {
        console.error("OTP Request Error:", error);
        showStashToast("Delivery Failed", "Could not send verification code. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
      
    } else if (step === 2) {
      if (!formData.otp) {
        newErrors.otp = 'Verification code is required.';
      } else if(!/^\d{6}$/.test(formData.otp)) {
        newErrors.otp = 'Code must contain only numbers.';
      } else if (formData.otp.length < 6) {
        newErrors.otp = 'Code must be exactly 6 digits.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showStashToast("Invalid Code", "Please enter a valid 6-digit code.", "warning");
        return;
      }

      try {
        setIsLoading(true);
        // Verify OTP
        const response = await axiosClient.post("/auth/verify-otp", { 
          email: formData.email, 
          otp: formData.otp 
        });

        if (response.data.success) {
          showStashToast("Verified", "Email successfully verified.", "success");
          setStep(3);
        } else {
          setErrors({ otp: 'The code is incorrect or has expired.' });
          showStashToast("Verification Failed", "Invalid code. Please try again.", "error");
        }
      } catch (error) {
        console.error("OTP Verification Error:", error);
        setErrors({ otp: 'Invalid or expired code.' });
        showStashToast("Verification Failed", "Please check your code and try again.", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 1 && !isLoading) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Master Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showStashToast("Validation Error", "Please fix the highlighted errors.", "warning");
      return;
    }

    try {
      setIsLoading(true);
      showStashToast("Creating Account", "Setting up your secure workspace...");
      
      const response = await axiosClient.post("/auth/register", {
        name: formData.name, 
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        showStashToast("Account Created", "Please log in to continue.", "success");
        navigate("/login"); 
      } else {
        showStashToast("Registration Failed", response.data.message || "An error occurred.", "error");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      showStashToast("Registration Failed", "Something went wrong. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    scope: 'openid profile email',
    flow: 'auth-code',
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        showStashToast("Authenticating", "Connecting via Google...");
        await postGoogleAuthCode(import.meta.env.VITE_BACKEND_URL, response.code);
        showStashToast("Account Created", "Successfully signed up with Google.", "success");
        const driveUrl = getMainAppDriveUrl();
        if (driveUrl) window.location.assign(driveUrl);
        else showStashToast("Drive destination missing", "Set VITE_MAIN_APP_ORIGIN to open your workspace.", "warning");
      } catch (error) {
        const message = error.status ? error.message : "Could not connect to the authentication service.";
        showStashToast("Authentication Failed", message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      showStashToast("Google Error", "An error occurred during Google sign up.", "error");
    }
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] flex font-sans overflow-hidden">
      
      {/* Left Panel - Brand & Visuals */}
      <div className="hidden lg:flex relative w-1/2 bg-[#050810] flex-col justify-between p-12 overflow-hidden border-r border-[#1E293B]">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div onClick={() => navigate("/")} className="relative z-10 flex items-center gap-3 cursor-pointer">
          <div className='w-10 h-10 rounded-full flex items-center justify-center'>
            <img src={assets.logo} alt="SwiftStash Logo" />
          </div>
          <h1 className='text-[#1467FF] font-bold text-2xl'>Swift<span className='text-purple-600'>Stash</span></h1>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111827] border border-blue-500/30 text-blue-400 text-sm font-medium mb-8 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Sparkles size={16} />
            Join the Next Generation
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Build your secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">digital sanctuary.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Create your account in seconds. Get access to military-grade encrypted storage and seamless collaboration tools immediately.
          </p>

          <div className="mt-12 flex items-center gap-4 p-5 rounded-2xl bg-[#111827]/50 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <UserPlus size={24} />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Fast & Frictionless Setup</p>
              <p className="text-slate-400 text-sm">No credit card required to start your secure workspace.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm text-center">
          &copy; {new Date().getFullYear()} SwiftStash. All rights reserved.
        </div>
      </div>

      {/* Right Panel - The Sliding Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className='w-10 h-10 rounded-full flex items-center justify-center'>
            <img src={assets.logo} alt="SwiftStash Logo" />
          </div>
          <h1 className='text-[#1467FF] font-bold text-2xl'>Swift<span className='text-purple-600'>Stash</span></h1>
        </div>

        <div className="w-full max-w-[520px] bg-[#111827]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden relative">
          
          <div className="px-10 pt-10 pb-4 flex items-center justify-between">
            <button 
              onClick={prevStep}
              disabled={isLoading}
              className={`p-2 -ml-2 rounded-xl transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 text-slate-400 hover:text-white hover:bg-slate-800'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex gap-2">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= item ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'w-3 bg-[#1E293B]'}`}
                />
              ))}
            </div>
          </div>

          <div className="w-full overflow-hidden pb-10">
            <div 
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] w-[300%]"
              style={{ transform: `translateX(-${(step - 1) * (100 / 3)}%)` }}
            >
              
              {/* --- STEP 1: NAME & EMAIL --- */}
              <div className="w-1/3 px-10">
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Mail size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Create Account</h2>
                  <p className="text-slate-400 text-base">Enter your details to set up your new workspace.</p>
                </div>

                <form onSubmit={handleNextStep} noValidate className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full bg-[#0B0F19]/50 border rounded-xl px-5 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                        errors.name 
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                          : 'border-slate-700/50 focus:border-purple-500 focus:ring-purple-500/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Full Name"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm font-medium text-red-400 animate-pulse">{errors.name}</p>
                    )}
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full bg-[#0B0F19]/50 border rounded-xl px-5 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                        errors.email 
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                          : 'border-slate-700/50 focus:border-purple-500 focus:ring-purple-500/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Email Address"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm font-medium text-red-400 animate-pulse">{errors.email}</p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-2 py-4 px-6 bg-white hover:bg-slate-200 text-slate-900 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin" size={20} /> Sending Code...</>
                    ) : (
                      <>Continue <ArrowRight size={20} /></>
                    )}
                  </button>
                  <p className="text-center text-slate-500 text-sm mt-4">
                    Already have an account? <Link to={"/login"} className="text-purple-400 hover:text-purple-300 transition-colors">Log in</Link>
                  </p>
                </form>

                {!isLoading && (
                  <>
                    <div className="flex items-center my-5 gap-3">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-sm text-zinc-400">OR</span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <button
                      type="button"
                      onClick={() => loginWithGoogle()}
                      className="w-full h-12 flex items-center justify-center gap-3 rounded-full bg-white text-gray-800 font-medium border border-gray-300 hover:bg-gray-50 transition shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.2l6.4-6.4C34.8 2.6 29.7 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.7 6C12.5 13.2 17.8 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.7h12.7c-.6 3.1-2.4 5.7-5.1 7.4l7.9 6.1c4.6-4.2 7.3-10.4 7.3-17.1z" />
                        <path fill="#FBBC05" d="M10.4 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.7-6c-1.6 3.2-2.6 6.8-2.6 10.4s.9 7.2 2.6 10.4l7.7-6z" />
                        <path fill="#34A853" d="M24 48c5.7 0 10.8-1.9 14.4-5.1l-7.9-6.1c-2.2 1.5-5 2.4-8.5 2.4-6.2 0-11.5-3.7-13.7-8.8l-7.7 6C6.6 42.6 14.6 48 24 48z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </>
                )}
              </div>

              {/* --- STEP 2: OTP --- */}
              <div className="w-1/3 px-10">
                <div className="mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <KeyRound size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Verify Email</h2>
                  <p className="text-slate-400 text-base">We sent a 6-digit verification code to <br/><span className="text-white font-medium">{formData.email || 'your email'}</span></p>
                </div>

                <form onSubmit={handleNextStep} noValidate className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Security Code</label>
                    <input 
                      type="text" 
                      name="otp"
                      maxLength={6}
                      value={formData.otp}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full bg-[#0B0F19]/50 border rounded-xl px-5 py-4 text-center text-3xl tracking-[0.5em] text-white placeholder-slate-700 focus:outline-none focus:ring-2 transition-all shadow-inner font-mono ${
                        errors.otp 
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                          : 'border-slate-700/50 focus:border-purple-500 focus:ring-purple-500/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="------"
                    />
                    {errors.otp && (
                      <p className="mt-2 text-sm font-medium text-center text-red-400 animate-pulse">{errors.otp}</p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </form>
              </div>

              {/* --- STEP 3: PASSWORD & CONFIRM PASSWORD --- */}
              <div className="w-1/3 px-10">
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-6 text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                    <Lock size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Secure Account</h2>
                  <p className="text-slate-400 text-sm">Set your master password. Make sure it's strong.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Master Password</label>
                    <input 
                      type="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full bg-[#0B0F19]/50 border rounded-xl px-5 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                        errors.password 
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                          : 'border-slate-700/50 focus:border-[#38BDF8] focus:ring-[#38BDF8]/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••••••"
                    />
                    {errors.password && (
                      <p className="mt-1.5 text-sm font-medium text-red-400 animate-pulse">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full bg-[#0B0F19]/50 border rounded-xl px-5 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                        errors.confirmPassword
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                          : 'border-slate-700/50 focus:border-[#38BDF8] focus:ring-[#38BDF8]/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-sm font-medium text-red-400 animate-pulse">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 px-6 mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin" size={20} /> Creating...</>
                    ) : (
                      <>Create Account <CheckCircle2 size={20} /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
