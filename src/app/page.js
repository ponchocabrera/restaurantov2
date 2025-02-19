'use client';

import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/shared/Footer';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <CTASection />
    </main>
  );
}

