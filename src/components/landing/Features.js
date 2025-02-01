export default function Features() {
  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left Column */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Signature Dishes</h2>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Featured Presentation</h3>
                  <p className="text-gray-600">Highlight your best dishes with stunning visuals and compelling descriptions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Smart Layout</h3>
                  <p className="text-gray-600">Optimize item placement based on customer behavior and sales data.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="grid grid-cols-2 gap-4">
            <img src="/dish-1.jpg" alt="Featured Dish" className="rounded-lg shadow-lg" />
            <img src="/dish-2.jpg" alt="Featured Dish" className="rounded-lg shadow-lg mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
