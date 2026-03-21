import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "./auth.config";
import { cookies } from "next/headers";

export const { 
  handlers: { GET, POST }, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check for our custom callback cookie
      const cookieStore = await cookies();
      const callbackUrl = cookieStore.get("auth-callback-url")?.value;

      if (callbackUrl) {
        // Return relative or absolute URL based on baseUrl
        return callbackUrl.startsWith("/") ? `${baseUrl}${callbackUrl}` : callbackUrl;
      }

      // Default behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  ...authConfig,
});
