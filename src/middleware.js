import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  },
});

export const config = {
  matcher: [
    "/restaurant-admin/:path*",
    "/api/restaurants/:path*",
    "/api/menus/:path*",
  ]
}; 