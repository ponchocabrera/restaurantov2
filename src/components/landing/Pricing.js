export default function Pricing() {
  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left Column - Contact Info */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Connect With Us</h2>
            <div className="grid grid-cols-2 gap-4">
              {['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson'].map((name, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <img 
                    src={`/team-${index + 1}.jpg`} 
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-gray-500">Sales Rep</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Demo Video */}
          <div className="bg-gray-100 rounded-lg p-8">
            <div className="aspect-w-16 aspect-h-9">
              <img 
                src="/demo-preview.jpg" 
                alt="Demo Video Preview" 
                className="rounded-lg object-cover"
              />
            </div>
            <button className="mt-4 w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
