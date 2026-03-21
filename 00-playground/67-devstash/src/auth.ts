import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "./auth.config";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

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
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials || {};
        
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email as string },
        });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(
          password as string,
          user.password
        );

        if (!isPasswordCorrect) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
