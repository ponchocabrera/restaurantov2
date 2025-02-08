import NextAuth from 'next-auth';
import { authOptions } from './auth.config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Re-export authOptions so other files can import from here
export { authOptions };
