import { NextResponse } from "next/server";
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
    const { email } = await req.json();

    const rateLimitResult = await checkRateLimit({
      namespace: "auth-resend-verification",
      limit: 3,
      window: "15 m",
      request: req,
      identifier: typeof email === "string" ? email : undefined,
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
        },
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      // Don't leak whether user exists or not
      return NextResponse.json({
        message: "Verification email sent if account exists",
      });
    }

    if (existingUser.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );
    await sendVerificationEmail(
      verificationToken.identifier,
      verificationToken.token,
    );

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("RESEND_VERIFICATION_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
