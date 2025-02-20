'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Intercom from '@intercom/messenger-js-sdk';

export default function IntercomMessenger() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // Adjust as needed if your user object uses different property names.
      const user = session.user;

      Intercom({
        app_id: 'w1rzvnm5',
        user_id: user.id,         // Replace with your user's ID
        name: user.name,          // Replace with your user's name
        email: user.email,        // Replace with your user's email
        // Replace "user.createdAt" with the Unix timestamp of sign-up if available,
        // or use a fallback value as needed.
        created_at: user.createdAt || Math.floor(Date.now() / 1000),
      });
    }
  }, [session]);

  return null;
}
