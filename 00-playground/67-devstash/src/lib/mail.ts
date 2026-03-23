import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${appUrl}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Confirm your email - DevStash",
    html: `
      <div>
        <h1>Welcome to DevStash!</h1>
        <p>Click the link below to verify your email address and complete your registration.</p>
        <p>
          <a href="${confirmLink}">Verify Email</a>
        </p>
        <p>If you did not request this email, please ignore it.</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
}
