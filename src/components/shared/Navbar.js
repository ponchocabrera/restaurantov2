'use client';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-4xl font-bold text-black" style={{ fontFamily: 'Outfit, sans-serif !important' }}>Carte</span>
            {/*<span className="text-xl font-medium text-[#FF7A5C]">.ai</span>*/}
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {session ? (
              <>
                <span className="text-gray-600 hidden lg:inline">
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
                <Link 
                  href="/menu-generator" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Try Demo
                </Link>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
          {session ? (
            <>
              <span className="block px-3 py-2 text-gray-600 text-sm">
                {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/menu-generator"
                className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Try Demo
              </Link>
              <Link
                href="/login"
                className="block px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 