import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Auth pages that should redirect to dashboard if already logged in
  const authPages = [
    "/sign-in",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  if (isLoggedIn && authPages.some((page) => pathname.startsWith(page))) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Protect /dashboard, /profile, /settings, and /favorites routes
  if (
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/favorites")) &&
    !isLoggedIn
  ) {
    const signInUrl = new URL("/sign-in", req.url);
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
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
