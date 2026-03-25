import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  checkRateLimit,
  getRateLimitErrorMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rateLimitResult = await checkRateLimit({
      namespace: "auth-reset-password",
      limit: 5,
      window: "15 m",
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
        },
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: resetToken.identifier,
            token: resetToken.token,
          },
        },
      });
      return NextResponse.json(
        { error: "Reset link has expired" },
        { status: 400 },
      );
    }

    if (!resetToken.identifier.startsWith("password-reset:")) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 },
      );
    }

    const email = resetToken.identifier.replace("password-reset:", "");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: resetToken.identifier,
            token: resetToken.token,
          },
        },
      }),
    ]);

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
