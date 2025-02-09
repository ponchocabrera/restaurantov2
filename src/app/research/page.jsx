'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';

export default function ResearchPage() {
  return (
    <DashboardLayout>
      <main className="p-8 max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-libre mb-6 leading-tight text-[#212350]">Research Insights</h1>
          <h2 className="text-2xl font-semibold mt-2">Discover the Foundations of Menu Success</h2>
          <p className="mt-4 text-lg text-gray-700">
            Explore diverse research areas that empower your restaurant with insights into menu design,
            color psychology, and engineering strategies.
          </p>
        </header>

        {/* Research Sections */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Menu and Color Psychology</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={`color-psych-${i}`} className="border rounded-lg p-5 shadow-lg bg-white">
                <h4 className="text-xl font-semibold text-gray-800">Placeholder {i + 1}</h4>
                <p className="text-gray-600">Research topic related to menu color psychology.</p>
                <a href="#" className="text-blue-500 font-medium mt-2 inline-block">Explore Research →</a>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Menu Engineering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={`menu-eng-${i}`} className="border rounded-lg p-5 shadow-lg bg-white">
                <h4 className="text-xl font-semibold text-gray-800">Placeholder {i + 1}</h4>
                <p className="text-gray-600">Research topic related to menu engineering.</p>
                <a href="#" className="text-blue-500 font-medium mt-2 inline-block">Explore Research →</a>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Upcoming Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={`upcoming-${i}`} className="border rounded-lg p-5 shadow-lg bg-white">
                <h4 className="text-xl font-semibold text-gray-800">Placeholder {i + 1}</h4>
                <p className="text-gray-600">Upcoming research insights on customer psychology.</p>
                <a href="#" className="text-blue-500 font-medium mt-2 inline-block">Explore Research →</a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}