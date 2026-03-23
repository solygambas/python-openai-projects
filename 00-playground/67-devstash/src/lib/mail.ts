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

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your password - DevStash",
    html: `
      <div>
        <h1>Reset your DevStash password</h1>
        <p>We received a request to reset the password for your account.</p>
        <p>
          <a href="${resetLink}">Reset Password</a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });
}
