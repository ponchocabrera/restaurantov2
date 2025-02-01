export default function Testimonials() {
  return (
    <div className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-12">Partner Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Success Story Cards */}
          <div className="bg-orange-100 p-6 rounded-lg">
            <img src="/restaurant-1.jpg" alt="Restaurant" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="font-semibold mb-2">The Rustic Kitchen</h3>
            <p className="text-gray-600">+45% increase in high-margin item sales</p>
          </div>
          <div className="bg-blue-100 p-6 rounded-lg">
            <img src="/restaurant-2.jpg" alt="Restaurant" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="font-semibold mb-2">Café Bella</h3>
            <p className="text-gray-600">Reduced menu design time by 80%</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg">
            <img src="/restaurant-3.jpg" alt="Restaurant" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="font-semibold mb-2">Gigi Italia</h3>
            <p className="text-gray-600">30% boost in customer satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}
