export default function Features() {
  return (
    <div className="bg-white">

      {/* Menu Intelligence Section - Left Aligned */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-left max-w-3xl">
          <h2 className="text-3xl font-bold font-libre text-black">Menu Intelligence</h2>
          <p className="text-gray-700 text-lg mt-2">
            Your Menu, enhanced by AI and years of Menu Psychology research. Increase your revenue by selling more of your best products and grow your business with AI.
          </p>
        </div>

        {/* Menu Analysis Section (modified) */}
        <div className="mt-12 space-y-10">

          {/* Menu Analysis with AI */}
          <h3 className="text-2xl font-bold font-outfit text-black">Menu Analysis with AI</h3>
          <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
            {/* Placeholder image */}
            <img
              src="/images/placeholder-analysis.jpg"
              alt="Menu Analysis Placeholder"
              className="max-w-full h-auto"
            />
          </div>

          {/* AI Image & Item Description Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-lg font-bold text-black">
              Create AI images and Item Descriptions tailored to your Menu and Restaurant’s voice.
            </div>
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              {/* Another placeholder image */}
              <img
                src="/images/placeholder-ai-image.jpg"
                alt="AI Image Placeholder"
                className="max-w-full h-auto"
              />
            </div>
          </div>

          {/* Menu Ready to Print Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              {/* Another placeholder image */}
              <img
                src="/images/placeholder-print.jpg"
                alt="Print-Ready Menu Placeholder"
                className="max-w-full h-auto"
              />
            </div>
            <div className="text-lg font-bold text-black">
              Build Beautiful Menus ready to print, based on a detailed analysis of your Menu, Brand, and Restaurant.
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Brown Section */}
      <div className="w-full py-24 md:py-60 px-6 sm:px-10 text-white bg-gradient-to-r from-[#AB5B39] to-[#CF7850]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          
          {/* Left Content */}
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-bold font-libre">Transform your Menu</h2>
            <p className="mt-4 text-lg">
              From a list of dishes into a strategic revenue engine. Our Menu Intelligence Platform combines AI forecasting with proven psychological triggers.
            </p>
            <div className="mt-6">
              <a
                href="#"
                className="inline-flex items-center px-6 py-3 bg-white text-black text-lg font-medium rounded-full shadow-md hover:bg-gray-100 transition-all"
              >
                Get your analysis for free
              </a>
            </div>
          </div>

          {/* Right Image Placeholder */}
          <div className="w-full sm:w-[300px] h-[300px] bg-gray-200 rounded-lg flex items-center justify-center mt-6 md:mt-0">
            <span className="text-gray-500">Image Placeholder</span>
          </div>

        </div>
      </div>

      {/* Signature Dishes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <h2 className="text-3xl font-bold font-outfit text-black">Your Menu Items - Data Driven</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-10 bg-white rounded-lg shadow-lg min-h-[250px]"></div>
          <div className="p-10 bg-gradient-to-br from-[#1D2C40] to-[#354861] rounded-lg shadow-lg min-h-[250px]"></div>
          <div className="p-10 bg-radial-gradient from-[#EC9B4B] to-[#DF8432] rounded-lg shadow-lg min-h-[250px]"></div>
          <div className="p-10 bg-white rounded-lg shadow-lg min-h-[250px] col-span-1 md:col-span-1"></div>
        </div>
      </div>
    </div>
  );
}
