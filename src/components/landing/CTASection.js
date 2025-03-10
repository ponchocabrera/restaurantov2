"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import LanguageToggle from "@/components/LanguageToggle";
import Link from "next/link";

export default function CTASection() {
  const { language } = useLanguage();
  const t = language === "es" ? es.ctaSection : en.ctaSection;

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t.title}
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            {t.description}
          </p>
          <button className="bg-orange-500 text-white px-8 py-3 rounded-full hover:bg-orange-600">
            {t.buttonText}
          </button>
          <div className="mt-8">
            <LanguageToggle />
          </div>
          <div className="mt-4">
            <Link
              href="/legal-disclaimer"
              className="text-gray-300 hover:text-gray-100 text-sm underline"
            >
              Legal Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 