import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // You can add additional logic here if needed.
  (req) => {
    return NextResponse.next();
  },
  {
    callbacks: {
      // A user is authorized if a token exists.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Exclude routes under "/api", "/_next", "/images", "/login", "/register", and the root "/"
  matcher: ["/((?!api|_next|images|login|register|$).*)"],
}; 