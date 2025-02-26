'use client';

import { useLanguage } from "@/contexts/LanguageContext";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const { language } = useLanguage();
  const [image, setImage] = useState(null);
  const router = useRouter();

  // Select the appropriate translations from the JSON files
  const t = language === "es" ? es.hero : en.hero;

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      router.push('/register');
    }
  };

  return (
    <div
      className="
        relative 
        bg-gradient-to-r from-[#222452] to-[#484DB0] 
        min-h-[55vh] md:min-h-[40vh] 
        flex flex-col justify-between 
        pb-[120px]  /* Ensure space for bottom white box on small screens */
      "
    >
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full flex items-center px-6 md:px-10 py-4">
        <Link href="/" className="text-2xl font-bold font-outfit text-[#FFFCFC]">
          Carte
        </Link>
        <div className="ml-auto flex items-center space-x-4 md:space-x-6">
          <Link
            href="/login"
            className="text-[#FFFCFC] text-sm font-medium hover:underline hidden sm:block"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 md:px-5 py-2 bg-[#21263E] text-white text-sm font-medium rounded-full shadow-md hover:bg-[#1A1A1A] transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Hero Content Container */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 h-full flex-1">
        {/* Left: Heading + Upload Box */}
        <div className="text-center md:text-left space-y-5 max-w-xl mt-16 md:mt-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-libre text-[#FFFCFC] leading-tight">
            {t.title}
          </h1>
          <p className="mt-2 text-lg text-[#FFFCFC]/90">
            {t.description}
          </p>

          <div className="mt-6 border-2 border-dashed border-[#FFFCFC] rounded-lg p-6 text-center bg-transparent shadow-lg cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="upload-menu"
            />
            <label htmlFor="upload-menu" className="cursor-pointer block">
              {image ? (
                <Image
                  src={image}
                  alt="Uploaded Menu"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              ) : (
                <>
                  <p className="text-[#FFFCFC] text-md font-medium">
                    {t.upload.placeholder}
                  </p>
                  <p className="mt-2 text-sm text-[#FFFCFC]">
                    {t.upload.subtext}
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Right: Larger, Responsive Placeholder Illustration */}
        <div className="mt-8 md:mt-0 flex-1 flex justify-center md:justify-end">
          <img
            src="/images/landing/HeroImage.png"
            alt={t.illustrationAlt}
            className="max-w-lg w-full h-auto"
          />
        </div>
      </div>

      {/* Bottom White Box */}
      <div
        className="
          absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 
          w-[95%] sm:w-[85%] md:w-[75%] lg:w-[65%] 
          bg-white py-5 px-6 shadow-lg rounded-full 
          flex flex-col md:flex-row items-center justify-between
          border text-center md:text-left
        "
      >
        <h3 className="text-md font-bold font-libre text-black mb-2 md:mb-0">
          Upload Your Menu
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Get Instant AI recommendations based on years of Research
        </p>
      </div>
    </div>
  );
}
