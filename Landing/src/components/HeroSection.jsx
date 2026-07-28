import React from 'react';
import { assets } from '../assets/assets';
import { CircleCheckBig, CircleDollarSign, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router';

const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative w-full overflow-hidden bg-[#0B0F19] min-h-screen flex items-center justify-center">
      
      {/* Background glow centered behind the layout */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* CHANGED: max-w-7xl, w-full, flex-col lg:flex-row, justify-between, and gap-16 lg:gap-24 */}
      <div className="mx-auto max-w-7xl w-full px-6 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 relative z-10">
        
        {/* Left Content (Text & Buttons) */}
        {/* CHANGED: lg:items-start lg:text-left to push content to the left edge on desktop */}
        <div className="flex flex-col items-center lg:items-start justify-center gap-6 text-center lg:text-left w-full lg:w-1/2">
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight flex flex-col items-center lg:items-start gap-2">
            <div className="flex justify-center lg:justify-start gap-3">
              <span className="text-primary">Fast.</span> 
              <span className="text-purple-500">Secure.</span>
            </div> 
            <span className="bg-gradient-to-r from-purple-500 to-primary text-transparent bg-clip-text">
              Simplified.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-[#9CA3AF] max-w-2xl mt-2 mx-auto lg:mx-0">
            End-to-end encrypted cloud storage that keeps your personal files truly personal.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-4 w-full">
            <button 
              onClick={() => navigate("/register")} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-semibold bg-primary text-white px-8 py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            >
              Get Started <MoveRight className="w-5 h-5" />
            </button>
            <button 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-semibold bg-white/5 border border-white/10 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              View Pricing <CircleDollarSign className="w-5 h-5 text-purple-400" />
            </button>
          </div>

          {/* Feature Checkmarks */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 mt-6">
            {['Encryption', 'Privacy', 'Secure', 'Effortless'].map((feature, index) => (
              <div key={index} className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
                <CircleCheckBig className="w-4 h-4 text-lime-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content (Image) */}
        {/* CHANGED: lg:justify-end to push the mascot to the right edge on desktop */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative mt-10 lg:mt-0">
          <div className="relative w-full max-w-[16rem] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
            {/* Inner glow specifically for the mascot */}
            <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full"></div>
            <img 
              src={assets.mascot} 
              alt="SwiftStash Mascot" 
              className="w-full h-auto relative z-10 drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]" 
              style={{ animationName: 'float', animationDuration: '6s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }}
            />
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default HeroSection;