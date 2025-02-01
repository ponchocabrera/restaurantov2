export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800">MenuGPT</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/menu-generator" className="text-gray-600 hover:text-gray-900">Try Demo</a>
            <a href="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
} 