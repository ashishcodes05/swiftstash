import React from 'react'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import FeatureSection from '../components/FeatureSection'
import HowSection from '../components/HowSection'
import PricingSection from '../components/PricingSection'
import Footer from '../components/FooterSection'
import FooterSection from '../components/FooterSection'
import LoginPage from './LoginPage'

const LandingPage = () => {
  return (
    <div className='mx-auto max-w-350.5'>
      <Navbar />
      <HeroSection />
      <FeatureSection />
      <HowSection />
      <PricingSection />
    </div>
  )
}

export default LandingPage