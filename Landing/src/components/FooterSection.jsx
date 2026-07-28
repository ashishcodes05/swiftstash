import React from 'react';
import { assets } from '../assets/assets';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="w-full text-white">
    <div class="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
        <div className='flex items-center justify-center gap-1'>
            <div className='w-10 h-10 rounded-full flex items-center justify-center'>
                <img src={assets.logo} alt="" />
            </div>
            <h1 className='text-[#1467FF] font-bold text-2xl'>Swift<span className='text-purple-600'>Stash</span></h1>
        </div>
        <p class="text-center max-w-xl text-sm font-normal leading-relaxed">
            Store securely. Share instantly. Work seamlessly. <br />
            Military-grade security meets lightning-fast collaboration.
        </p>
    </div>
    <div class="border-t border-[#3B1A7A]">
        <div class="max-w-7xl mx-auto px-6 py-6 text-center text-sm font-normal">
            <a href="https://prebuiltui.com">swiftstash</a> ©2026. All rights reserved.
        </div>
    </div>
</footer>
  );
};

export default FooterSection;