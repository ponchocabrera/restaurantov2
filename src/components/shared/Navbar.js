'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800">MenuGPT</span>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-gray-600">
                  {session.user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/menu-generator" className="text-gray-600 hover:text-gray-900">
                  Try Demo
                </a>
                <a href="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Sign In
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 