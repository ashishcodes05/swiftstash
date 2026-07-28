import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const pricingData = [
  {
    title: 'Basic Plan',
    price: 299,
    features: ['5 Projects', '10 GB Storage', 'Basic Support', 'Community Access', 'Basic code review'],
    buttonText: 'Get Started',
  },
  {
    title: 'Pro Plan',
    price: 799,
    mostPopular: true,
    features: ['50 Projects', '100 GB Storage', 'Priority Support', 'Team Collaboration', 'Advanced Analytics', 'Premium Code Review'],
    buttonText: 'Upgrade Now',
  },
  {
    title: 'Enterprise Plan',
    price: 1499,
    features: ['Unlimited Projects', '1 TB Storage', '24/7 Dedicated Support', 'Custom Integrations', 'SLA Guarantee'],
    buttonText: 'Contact Sales',
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 px-6 bg-background text-text-main flex flex-col items-center overflow-hidden">
      
      {/* Header Section */}
      <div className="text-center z-10 mb-16">
        <div className="inline-flex items-center justify-center mb-6">
          <span className="text-sm md:text-base font-semibold tracking-wide uppercase bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 border border-purple-500/30 py-2 px-6 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-500/5">
            Pricing
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
          Our Pricing Plans
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg leading-relaxed">
          Flexible pricing options designed to meet your needs — whether you're just getting started or scaling up.
        </p>
      </div>

      {/* Pricing Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full items-stretch">
        {pricingData.map((plan) => (
          <div 
            key={plan.title} 
            className={`relative flex flex-col p-8 rounded-2xl w-full transition-transform duration-300 ${
              plan.mostPopular 
                ? 'bg-card-bg border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)] md:-translate-y-4' 
                : 'bg-card-bg/80 border border-[#1E293B] hover:border-slate-700'
            }`}
          >
            {/* Most Popular Badge */}
            {plan.mostPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 py-1 px-4 rounded-full bg-linear-to-r from-blue-500 to-purple-600 text-white text-xs font-bold tracking-wide shadow-lg">
                <Sparkles size={14} />
                Most Popular
              </div>
            )}

            {/* Plan Title & Price */}
            <div className="text-center md:text-left mb-8">
              <p className={`font-medium text-lg mb-2 ${plan.mostPopular ? 'text-purple-400' : 'text-slate-400'}`}>
                {plan.title}
              </p>
              <h4 className="text-4xl font-bold text-text-main">
                ₹{plan.price}
                <span className="font-normal text-base text-text-secondary">/mo</span>
              </h4>
            </div>

            <hr className={`border-t mb-8 ${plan.mostPopular ? 'border-purple-500/20' : 'border-[#1E293B]'}`} />

            {/* Features List */}
            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 text-text-secondary text-sm">
                  <Check 
                    size={20} 
                    className={`shrink-0 mt-0.5 ${plan.mostPopular ? 'text-purple-400' : 'text-blue-400'}`} 
                  />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Call to Action Button */}
            <button 
              className={`mt-auto w-full py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                plan.mostPopular
                  ? 'text-sm bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-[#1E293B] hover:bg-slate-700 text-text-main text-sm font-semibold border border-[#1E293B] hover:border-slate-700'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

    </section>
  );
};

export default PricingSection;