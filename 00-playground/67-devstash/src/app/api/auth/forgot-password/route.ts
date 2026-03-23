import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = await generatePasswordResetToken(email);
      await sendPasswordResetEmail(email, resetToken.token);
    }

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
