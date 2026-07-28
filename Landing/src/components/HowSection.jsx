import React from 'react';
import { UserPlus, CloudUpload, Share } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Create an Account",
    description: "Sign up in seconds and instantly get access to your secure, encrypted workspace.",
    icon: <UserPlus size={28} className="text-blue-400" />,
    stepText: "1"
  },
  {
    id: 2,
    title: "Upload Your Files",
    description: "Drag and drop your heaviest assets or import your existing folder structures directly.",
    icon: <CloudUpload size={28} className="text-purple-400" />,
    stepText: "2"
  },
  {
    id: 3,
    title: "Share and Access",
    description: "Generate secure links with custom permissions and collaborate from anywhere.",
    icon: <Share size={28} className="text-fuchsia-400" />,
    stepText: "3"
  }
];

const HowSection = () => {
  return (
    <section className="py-24 px-6 bg-[#0B0F19] text-[#F9FAFB] flex flex-col items-center overflow-hidden">
      
      {/* Header Section */}
      <div className="text-center z-10 mb-20">
        <div className="inline-flex items-center justify-center mb-6">
          <span className="text-sm md:text-base font-semibold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 border border-purple-500/30 py-2 px-6 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-500/5">
            How It Works
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Simple from Start to Finish
        </h2>
        <p className="text-[#9CA3AF] max-w-2xl mx-auto text-lg leading-relaxed">
          Get your workflow running at maximum efficiency in just three simple steps.
        </p>
      </div>

      {/* Steps Container */}
      <div className="relative max-w-6xl w-full mx-auto">
        
        {/* Desktop/Tablet Horizontal Connecting Line */}
        <div className="hidden md:block absolute top-[44px] left-[16.66%] right-[16.66%] h-[2px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-fuchsia-500/30 z-0"></div>

        {/* Mobile Vertical Connecting Line */}
        <div className="block md:hidden absolute top-[44px] bottom-[100px] left[50%] md:left-auto md:right-auto w-[2px] bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-fuchsia-500/30 z-0 left-1/2 -translate-x-1/2"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center group">
              
              {/* Icon / Circle Container */}
              <div className="relative mb-8">
                {/* Outer Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                
                {/* Icon Background */}
                <div className="relative w-24 h-24 rounded-full bg-[#111827] border-2 border-[#1E293B] group-hover:border-purple-500/50 flex items-center justify-center transition-colors duration-300 shadow-xl">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                
                {/* Step Number Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1f2b48] px-3 py-1 rounded-full border border-blue-700/50 text-xs font-bold text-text-main tracking-wider shadow-sm">
                  {step.stepText}   
                </div>
              </div>

              {/* Text Content */}
              <div className="px-4">
                <h3 className="text-xl font-semibold mb-3 text-[#F9FAFB] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                  {step.title}
                </h3>
                <p className="text-[#9CA3AF] text-base leading-relaxed">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default HowSection;