import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      // Don't leak whether user exists or not
      return NextResponse.json({ message: "Verification email sent if account exists" });
    }

    if (existingUser.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    const verificationToken = await generateVerificationToken(existingUser.email);
    await sendVerificationEmail(verificationToken.identifier, verificationToken.token);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("RESEND_VERIFICATION_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
