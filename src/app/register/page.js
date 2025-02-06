'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      alert(data.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Empty White Space */}
      <div className="hidden md:flex w-1/2 bg-white"></div>

      {/* Right Side - Registration Form */}
      <div className="w-full md:w-1/2 bg-[#F7F7F7] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Section */}
          <div className="text-left space-y-2">
            <h1 className="text-4xl font-bold text-black font-outfit">Carte</h1>
            <h2 className="text-5xl font-bold text-black font-libre">Menu Intelligence</h2>
            <h3 className="text-2xl font-bold text-black font-outfit">Made Easy with AI</h3>
            <p className="text-gray-600">Welcome to your new AI-powered Restaurant!<br/>Create a new account.</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#212350] focus:outline-none focus:ring-1 focus:ring-[#212350]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#212350] focus:outline-none focus:ring-1 focus:ring-[#212350]"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#212350] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#212350]"
            >
              Create your account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
