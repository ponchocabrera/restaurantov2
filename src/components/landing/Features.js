export default function Features() {
  return (
    <div className="bg-white">
      {/* Menu Intelligence Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-left max-w-3xl">
          <h2 className="text-3xl font-bold font-libre text-black">
            Menu Intelligence
          </h2>
          <p className="text-gray-700 text-lg mt-2">
            Your Menu, enhanced by AI and years of Menu Psychology research. Increase your
            revenue by selling more of your best products and grow your business with AI.
          </p>
        </div>

        <div className="mt-12 space-y-16">
          {/* --- 1) Menu Analysis with AI --- */}
          <div>
            <h3 className="text-2xl font-bold font-outfit text-black mb-4">
              Menu Analysis with AI
            </h3>
            {/* 
              2 columns, each has a minHeight so they line up,
              each column flexes text to the top, image to the bottom
            */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              style={{ minHeight: "450px" }}
            >
              {/* Left column */}
              <div className="flex flex-col justify-between">
                {/* Top: text */}
                <div>
                  <p className="text-gray-700 mb-4">
                    Get AI powered analysis based on more than 140 factors. 
                    Discovers what your Menu says about your items and restaurant.
                  </p>
                </div>
                {/* Bottom: image */}
                <div>
                  <img
                    src="/images/landing/MenuAnalysis1.png"
                    alt="Menu Analysis 1"
                    className="m-0 p-0 block w-auto h-auto rounded-lg mx-auto"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col justify-between">
                {/* Top: text */}
                <div>
                  <p className="text-gray-700 mb-4">
                    Get Improvements for your Menu based on AI and years of Research on 
                    Menu Engineering and Psychology.
                  </p>
                </div>
                {/* Bottom: image */}
                <div>
                  <img
                    src="/images/landing/MenuRecommendations1.png"
                    alt="Menu Analysis 2"
                    className="m-0 p-0 block w-auto h-auto rounded-lg mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- 1) Menu Analysis with AI --- */}
          <div>
            <h3 className="text-2xl font-bold font-outfit text-black mb-4">
            Get AI to help you understand your Restaurant’s 
            performance and what’s trending in your Area
            </h3>
            {/* 
              2 columns, each has a minHeight so they line up,
              each column flexes text to the top, image to the bottom
            */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              style={{ minHeight: "450px" }}
            >
              {/* Left column */}
              <div className="flex flex-col justify-between">
                {/* Top: text */}
                <div>
                  <p className="text-gray-700 mb-4">
                  Get notified what is trending around your Restaurant’s Area, weather it is a new Menu, Dish, or improved ambiance. Get ahead your area with AI driven recommendations.
                  </p>
                </div>
                {/* Bottom: image */}
                <div>
                  <img
                    src="/images/landing/ZoneReviewerImage.png"
                    alt="Menu Analysis 1"
                    className="m-0 p-0 block w-auto h-auto rounded-lg mx-auto"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col justify-between">
                {/* Top: text */}
                <div>
                  <p className="text-gray-700 mb-4">
                  Track your restaurant’s Score, and see where do you stand in comparison with other restaurants in your Area. Get AI driven recommendations on how to improve! 
                  </p>
                </div>
                {/* Bottom: image */}
                <div>
                  <img
                    src="/images/landing/RestaurantSearch.png"
                    alt="Menu Analysis 2"
                    className="m-0 p-0 block w-auto h-auto rounded-lg mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- 2) AI Image & Item Description Section --- */}
          <div
            style={{ minHeight: "350px" }} 
            // Adjust if you want them even taller/shorter
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Left column: text top, image bottom if needed */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-xl font-bold text-black mb-4">
                    Tailor your menu items with AI-generated images and descriptions to
                    match your brand voice and captivate your customers.
                  </p>
                </div>
                <div>{/* if you wanted an image at bottom, place it here */}</div>
              </div>

              {/* Right column: image pinned at bottom if desired */}
              <div className="border-2 border-dashed rounded-lg p-4 flex flex-col justify-end">
                <img
                  src="/images/landing/AiGenimage.png"
                  alt="AI Image Placeholder"
                  className="m-0 block w-auto h-auto mx-auto"
                />
              </div>
            </div>
          </div>

          {/* --- 3) Menu Ready to Print Section --- */}
          <div
            style={{ minHeight: "350px" }}
          >
            <h3 className="text-xl font-bold text-black mb-4">
              Print-Ready Menus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Left column: pinned image at bottom */}
              <div className="border-2 border-dashed rounded-lg p-4 flex flex-col justify-end">
                <img
                  src="/images/placeholder-print.jpg"
                  alt="Print-Ready Menu Placeholder"
                  className="m-0 p-0 block w-auto h-auto mx-auto"
                />
              </div>

              {/* Right column: text at top, or pinned differently if you like */}
              <div className="flex flex-col justify-center">
                <p className="text-gray-700">
                  Build beautiful, print-ready menus based on detailed analysis of your Menu,
                  Brand, and Restaurant. Enhance customer experience and boost profitability.
                </p>
              </div>
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
              From a list of dishes into a strategic revenue engine. Our Menu Intelligence
              Platform combines AI forecasting with proven psychological triggers.
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
