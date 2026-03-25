import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email?status=error", req.url)
      );
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token,
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/verify-email?status=invalid", req.url)
      );
    }

    const hasExpired = new Date(verificationToken.expires) < new Date();

    if (hasExpired) {
      return NextResponse.redirect(
        new URL(
          `/verify-email?status=expired&email=${encodeURIComponent(verificationToken.identifier)}`,
          req.url
        )
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!existingUser) {
      return NextResponse.redirect(
        new URL("/verify-email?status=error", req.url)
      );
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingUser.email,
      },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/verify-email?status=success", req.url)
    );
  } catch (error) {
    console.error("VERIFICATION_ERROR", error);
    return NextResponse.redirect(
      new URL("/verify-email?status=error", req.url)
    );
  }
}
