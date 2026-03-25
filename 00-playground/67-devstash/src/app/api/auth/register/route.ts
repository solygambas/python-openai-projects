import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import {
  checkRateLimit,
  getRateLimitErrorMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rateLimitResult = await checkRateLimit({
      namespace: "auth-register",
      limit: 3,
      window: "1 h",
      request: req,
    });

    if (!rateLimitResult.success) {
      const retryAfter = getRetryAfterSeconds(rateLimitResult.reset);

      return NextResponse.json(
        { error: getRateLimitErrorMessage(rateLimitResult.reset) },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const { name, email, password, confirmPassword } = await req.json();

    if (!name || !email || !password || confirmPassword === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const githubAccount = await prisma.account.findFirst({
        where: {
          userId: existingUser.id,
          provider: "github",
        },
        select: { id: true },
      });

      return NextResponse.json(
        {
          error: githubAccount
            ? existingUser.password
              ? "An account already exists with this email. Sign in with GitHub or use your password instead of registering again."
              : "An account already exists with this email and is linked to GitHub. Please sign in with GitHub."
            : "An account already exists with this email. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationEnabled =
      process.env.ENABLE_EMAIL_VERIFICATION === "true";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Auto-verify when email verification is disabled
        ...(!emailVerificationEnabled && { emailVerified: new Date() }),
      },
    });

    if (emailVerificationEnabled) {
      const verificationToken = await generateVerificationToken(user.email);
      await sendVerificationEmail(
        verificationToken.identifier,
        verificationToken.token
      );
    }

    return NextResponse.json(
      {
        message: emailVerificationEnabled
          ? "User registered successfully. Please check your email to verify your account."
          : "User registered successfully.",
        requiresVerification: emailVerificationEnabled,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
