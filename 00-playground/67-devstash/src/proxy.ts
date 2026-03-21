import { NextResponse } from 'next/server'
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    const response = NextResponse.redirect(signInUrl);
    
    // Store the intended destination in a cookie for later
    response.cookies.set("auth-callback-url", pathname, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    
    return response;
  }
  
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
