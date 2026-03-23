import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "./auth.config";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified"
}

class GitHubOnlyAccountError extends CredentialsSignin {
  code = "GitHubOnlyAccount"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !user.email) {
        return true;
      }

      const data: { name?: string; image?: string } = {};

      if (typeof user.name === "string" && user.name.trim().length > 0) {
        data.name = user.name;
      }

      if (typeof user.image === "string" && user.image.trim().length > 0) {
        data.image = user.image;
      }

      if (Object.keys(data).length === 0) {
        return true;
      }

      try {
        await prisma.user.update({
          where: { email: user.email },
          data,
        });
      } catch {
        return true;
      }

      return true;
    },
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
  pages: {
    signIn: "/sign-in",
  },
  ...authConfig,
  providers: [
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),
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

        if (!user) return null;

        if (!user.password) {
          const githubAccount = await prisma.account.findFirst({
            where: {
              userId: user.id,
              provider: "github",
            },
            select: { id: true },
          });

          if (githubAccount) {
            throw new GitHubOnlyAccountError();
          }

          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          password as string,
          user.password
        );

        if (!isPasswordCorrect) return null;

        if (process.env.ENABLE_EMAIL_VERIFICATION === "true" && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

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
