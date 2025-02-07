'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Hero() {
  const [image, setImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-[#E49B4F] to-[#F4B55A] min-h-[75vh] md:min-h-[60vh] flex flex-col justify-between">
      {/* Navbar Section */}
      <div className="absolute top-0 left-0 w-full flex items-center px-6 md:px-10 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold font-outfit text-[#21263E]">
          Carte
        </Link>

        {/* Navigation - Always Sticks to the Right */}
        <div className="ml-auto flex items-center space-x-4 md:space-x-6">
          <Link href="/login" className="text-[#21263E] text-sm font-medium hover:underline hidden sm:block">
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

      {/* Hero Content */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 h-full flex-1">
        {/* Left Content - Upload Section */}
        <div className="text-center md:text-left space-y-5 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-libre text-[#21263E] leading-tight">
            Dynamic Menu Optimization
          </h1>
          <p className="mt-2 text-lg text-[#21263E]/90">
            Your menu is your most powerful sales tool. But is it working as hard as it could be?
          </p>
          <div className="mt-6 border-2 border-dashed border-[#21263E] rounded-lg p-6 text-center bg-transparent shadow-lg cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="upload-menu" />
            <label htmlFor="upload-menu" className="cursor-pointer block">
              {image ? (
                <Image src={image} alt="Uploaded Menu" width={100} height={100} className="mx-auto" />
              ) : (
                <>
                  <p className="text-[#21263E] text-md font-medium">Click to upload or drag and drop</p>
                  <p className="mt-2 text-sm text-gray-500">Upload your Menu and get your insights</p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Right Content - Information Cards */}
        <div className="relative flex flex-col mt-8 md:mt-0 max-w-sm space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl relative z-10">
            <h3 className="text-[#21263E] text-lg font-bold font-libre">Brand Identity Integration</h3>
            <p className="text-gray-600 text-sm">The playful design and colors reinforce a friendly, fun brand identity.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl absolute top-20 left-10 z-0">
            <h3 className="text-[#21263E] text-lg font-bold font-libre">Price Anchoring Techniques</h3>
            <p className="text-gray-600 text-sm">Higher-priced signature items can serve as anchors for consumers assessing value.</p>
          </div>
        </div>
      </div>

      {/* Bottom Section Box */}
      <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[85%] md:w-[75%] lg:w-[65%] bg-white py-5 px-6 shadow-lg rounded-full flex flex-col md:flex-row items-center justify-between border text-center md:text-left">
        <h3 className="text-md font-bold font-libre text-black">
          Upload Your Menu
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Get Instant AI recommendations based on years of Research
        </p>
      </div>
    </div>
  );
}
