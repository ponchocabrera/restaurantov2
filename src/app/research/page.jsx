'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import Link from 'next/link';

export default function ResearchPage() {
  return (
    <DashboardLayout>
      <main className="p-8 max-w-6xl mx-auto">

        {/* TOP TEXT (outside the banner) */}
        <section className="mb-10">
          <h1 className="text-2xl sm:text-5xl font-bold font-libre mb-2 sm:mb-4">
            Understand what makes a Menu Successful
          </h1>
          <h2 className="text-2xl font-bold">Research Insights</h2>
          <p className="text-gray-600">
            Get Research based reports to improve your business
          </p>
        </section>

        {/* BANNER SECTION */}
        <section className="relative mb-12 border rounded-md shadow-lg bg-white p-6 md:p-10 flex flex-col md:flex-row items-center">
          {/* LEFT: Banner Content */}
          <div className="w-full md:w-2/3 md:pr-8 flex flex-col justify-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#212350] mb-3">
                Learn more about your Restaurant
              </h2>
              <p className="text-gray-700 mb-2">
                Understand the food business industry around your area, find trends and learn how to grow your business.
              </p>
            </div>
            <Link legacyBehavior href="/restaurant-insights">
              <a className="mt-4 self-center md:self-start px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                Learn More
              </a>
            </Link>
          </div>

          {/* RIGHT: Image Placeholder */}
          <div className="hidden md:block relative md:w-1/3">
            <img 
              src="/images/landing/ZoneReviewerImage.png" 
              alt="Placeholder Image" 
              className="w-full h-auto rounded-md" 
            />
          </div>
        </section>

        {/* Menu Psychology Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#212350] mb-4">Menu Psychology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => {
              if (i === 0) {
                return (
                  <Link legacyBehavior href="/research/theScienceBehindRestaurantMenu" key="menu-psych-science">
                    <a className="border rounded-lg p-5 shadow bg-white flex items-center gap-4">
                      <img 
                        src="/assets/icons/step1.png" 
                        alt="Placeholder Card Image" 
                        className="w-16 h-16 object-cover rounded" 
                      />
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">
                          The Science Behind Restaurant Menu Design
                        </h4>
                        <p className="text-gray-600">
                          Explore how scientific principles and psychological insights shape menu design to increase customer engagement and drive sales.
                        </p>
                      </div>
                    </a>
                  </Link>
                );
              }
              if (i === 1) {
                return (
                  <Link legacyBehavior href="/research/theArtandScienceofaMenu" key="menu-psych-artandscience">
                    <a className="border rounded-lg p-5 shadow bg-white flex items-center gap-4">
                      <img 
                        src="/assets/icons/step2.png" 
                        alt="Placeholder Card Image" 
                        className="w-16 h-16 object-cover rounded" 
                      />
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">
                          The Art and Science of a Menu
                        </h4>
                        <p className="text-gray-600">
                          Discover how creative design and culinary insights merge to craft menus that captivate and convert.
                        </p>
                      </div>
                    </a>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </section>

      </main>
    </DashboardLayout>
  );
}
