'use client';

import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/shared/Footer';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <CTASection />
    </main>
  );
}

