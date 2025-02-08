"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // If the URL has ?callbackUrl=/somepage, we use that; otherwise default to /dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // If NextAuth returns an error (e.g. bad credentials), show it
        setError(result.error);
      } else {
        // On success, go to callbackUrl
        router.push(callbackUrl);
        router.refresh(); // optional, forces re-fetching data
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side */}
      <div className="w-full md:w-1/2 bg-white flex items-start justify-start p-8">
        <h1 className="text-4xl font-bold text-black font-outfit">Carte</h1>
      </div>

      {/* Right side with login form */}
      <div className="w-full md:w-1/2 bg-[#F7F7F7] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2 text-left">
            <h2 className="text-5xl font-bold text-black font-libre">
              Menu Intelligence
            </h2>
            <h3 className="text-2xl font-bold text-black font-outfit">
              Made Easy with AI
            </h3>
            <div className="space-y-1">
              <p className="text-gray-600">Welcome Back!</p>
              <p className="text-gray-600">Log into your account</p>
            </div>
          </div>

          {/* Error message display */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                User email
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
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
              Enter to your account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
