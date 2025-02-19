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

        {/* Increased top margin to 16, space-y to 24 for bigger vertical spacing */}
        <div className="mt-16 space-y-24">
          {/* --- 1) Menu Analysis with AI --- */}
          <div>
            <h3 className="text-2xl font-bold font-outfit text-black mb-4">
              Menu Analysis with AI
            </h3>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              style={{ minHeight: "450px" }}
            >
              {/* Left column */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-gray-700 mb-4">
                    Get AI powered analysis based on more than 140 factors. 
                    Discovers what your Menu says about your items and restaurant.
                  </p>
                </div>
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
                <div>
                  <p className="text-gray-700 mb-4">
                    Get Improvements for your Menu based on AI and years of Research on 
                    Menu Engineering and Psychology.
                  </p>
                </div>
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

          {/* --- 1) Another Analysis Section --- */}
          <div>
            <h3 className="text-2xl font-bold font-outfit text-black mb-4">
              Get AI to help you understand your Restaurant’s 
              performance and what’s trending in your Area
            </h3>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              style={{ minHeight: "450px" }}
            >
              {/* Left column */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-gray-700 mb-4">
                    Get notified what is trending around your Restaurant’s Area, whether it
                    is a new Menu, Dish, or improved ambiance. Get ahead in your area with 
                    AI-driven recommendations.
                  </p>
                </div>
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
                <div>
                  <p className="text-gray-700 mb-4">
                    Track your restaurant’s Score, and see where you stand in comparison 
                    with other restaurants in your Area. Get AI-driven suggestions on how
                    to improve!
                  </p>
                </div>
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
          <div style={{ minHeight: "350px" }}>
            {/* Two columns. items-center ensures vertical alignment. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              {/* Left column: text, centered vertically & horizontally */}
              <div className="flex justify-center">
                <p className="text-xl font-bold text-black text-left">
                  Tailor your menu items with AI-generated images and descriptions to
                  match your brand voice and captivate your customers.
                </p>
              </div>

              {/* Right column: a larger image, also centered */}
              <div className="flex justify-center">
                <img
                  src="/images/landing/AiGenimage.png"
                  alt="AI Image Placeholder"
                  className="block w-[1500px] h-auto"
                />
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Full-Width Brown Section */}
      {/* Increased vertical spacing from py-8 to py-12, from md:py-60 to md:py-64 */}
      <div className="w-full py-12 md:py-64 px-6 sm:px-10 text-white bg-gradient-to-r from-[#232553] to-[#E89042]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          {/* Left Content */}
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-6xl font-bold font-libre">Execute your Menu with proper staffing</h2>
            <p className="mt-6 text-xl">
              Get AI to create your Restaurant’s staffing schedule for you. Save up to 2 hours per
              week. If someone is a no show, let our AI powered communication system take care of it.
            </p>
            <div className="mt-8">
              <a
                href="#"
                className="inline-flex items-center px-8 py-4 bg-white text-black text-xl font-semibold rounded-full shadow-md hover:bg-gray-100 transition-all"
              >
                Create your team schedule
              </a>
            </div>
          </div>

          {/* Right Image (no box, made larger) */}
          <div className="flex items-center justify-center mt-8 md:mt-0">
            <img
              src="/images/landing/Scheduler.png"
              alt="Scheduler Illustration"
              className="w-[1800px] h-auto"
            />
          </div>
        </div>
      </div>

    
    </div>
  );
}
