export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/home/:path*',
    '/creator-studio/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/chat/:path*',
    '/notifications/:path*',
  ],
};
