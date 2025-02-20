'use client';
import { SessionProvider } from 'next-auth/react';
import IntercomMessenger from '@/components/IntercomMessenger';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <IntercomMessenger />
      {children}
    </SessionProvider>
  );
} 