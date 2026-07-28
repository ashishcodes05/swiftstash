import React from 'react';
import { CloudDownload, Share2, ShieldCheck, Zap } from 'lucide-react';
import { assets } from '../assets/assets';
// import { assets } from '../assets/assets'; // Uncomment this to use your assets

const features = [
  {
    id: 1,
    icon: <Zap size={28} className="text-purple-400" />,
    title: "Fast Upload And Download",
    description: "Our optimized infrastructure ensures your heaviest assets transfer at maximum bandwidth, saving you hours of waiting."
  },
  {
    id: 2,
    icon: <CloudDownload size={28} className="text-blue-400" />,
    title: "Import From Google Drive",
    description: "Connect your Google account to securely pull your existing folder structures directly into your new workspace."
  },
  {
    id: 3,
    icon: <ShieldCheck size={28} className="text-indigo-400" />,
    title: "End-to-End Encryption",
    description: "Your files are locked with military-grade encryption. Only you hold the key—not even our team can see what you store."
  },
  {
    id: 4,
    icon: <Share2 size={28} className="text-fuchsia-400" />,
    title: "Robust Sharing System",
    description: "Generate secure links for clients or teammates with custom permissions. You decide exactly who gets access."
  }
];

const FeatureSection = () => {
  return (
    <section className="py-24 px-6 bg-[#0B0F19] text-[#F9FAFB] flex flex-col items-center overflow-hidden">
      
      {/* Header Section */}
      <div className="text-center z-10 mb-16">
        <div className="inline-flex items-center justify-center mb-6">
          <span className="text-sm md:text-base font-semibold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 border border-purple-500/30 py-2 px-6 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-500/5">
            Core Features
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Supercharge Your Workflow
        </h2>
        <p className="text-[#9CA3AF] max-w-2xl mx-auto text-lg leading-relaxed">
          Everything you need to manage your files, without the friction. Designed for speed, security, and seamless collaboration.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 max-w-7xl w-full">
        
        {/* Left Side: Feature Cards */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="relative group overflow-hidden rounded-2xl p-[2px] cursor-pointer"
            >
              {/* Rotating Gradient Border - Updated to Blue/Purple */}
              <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0B0F19_0%,#8B5CF6_35%,#3B82F6_50%,#0B0F19_65%)] opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Card Content */}
              <div className="relative h-full w-full bg-[#111827]/90 backdrop-blur-xl rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10 transition-transform duration-300 group-hover:scale-[0.99]">
                
                {/* Icon Container */}
                <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-shadow duration-300">
                  {feature.icon}
                </div>

                {/* Text Content */}
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-[#F9FAFB] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Image/Illustration Placeholder */}
        {/* Right Side: Overlapping Images Layout */}
        <div className="hidden lg:flex w-full lg:w-1/2 relative justify-center items-center min-h-[500px]">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-purple-600/15 via-blue-500/10 to-transparent blur-[80px] rounded-full pointer-events-none"></div>

          {/* Image 1: Main Dashboard (Back) */}
          <div className="absolute w-[80%] right-[5%] top-[5%] z-10 transition-transform duration-700 ease-out hover:-translate-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#111827]">
              {/* Subtle top-light gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none"></div>
              <img 
                src={assets.dashboard} 
                alt="Main Dashboard Interface" 
                className="w-full h-auto object-cover block" 
              />
            </div>
          </div>

          {/* Image 2: File List / Folder View (Middle - Bottom Left Overlap) */}
          <div className="absolute w-[55%] left-0 bottom-[10%] z-20 transition-transform duration-500 ease-out hover:-translate-y-3 hover:scale-[1.02]">
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] shadow-blue-900/20 bg-[#1F2937]/95 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent pointer-events-none"></div>
              <img 
                /* Replace with a secondary asset like a file list or mobile view */
                src={assets.dashboard2} 
                alt="File Manager View" 
                className="w-full h-auto object-cover block"  
              />
            </div>
          </div>

          {/* Image 3: Security/Sharing Widget (Front - Top Right Overlap) */}
          <div className="absolute w-[40%] right-[-5%] top-[35%] z-30 transition-transform duration-500 ease-out hover:-translate-y-2 hover:scale-[1.05]">
            <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-[0_25px_50px_rgba(0,0,0,0.7)] shadow-purple-900/30 bg-[#0B0F19]/90 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-transparent pointer-events-none"></div>
              <img 
                /* Replace with a small widget asset like a sharing dialog or encryption badge */
                src={assets.dashboard3} 
                alt="Security Widget" 
                className="w-full h-auto object-cover block" 
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureSection;