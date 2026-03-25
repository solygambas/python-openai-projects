import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "pending";
  const email =
    typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Mail className="size-4" />
          </div>
          DevStash
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {status === "success" && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              {status === "error" && (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              {status === "invalid" && (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              {status === "expired" && (
                <AlertCircle className="h-6 w-6 text-orange-500" />
              )}
              {status === "pending" && (
                <Mail className="h-6 w-6 text-primary" />
              )}
            </div>

            <CardTitle className="text-xl">
              {status === "success" && "Email Verified"}
              {status === "error" && "Verification Failed"}
              {status === "invalid" && "Invalid Token"}
              {status === "expired" && "Link Expired"}
              {status === "pending" && "Check Your Email"}
            </CardTitle>

            <CardDescription>
              {status === "success" &&
                "Your email has been successfully verified. You can now sign in."}
              {status === "error" &&
                "There was an error verifying your email. Please try again or contact support."}
              {status === "invalid" &&
                "This verification link is invalid or has already been used."}
              {status === "expired" &&
                "This verification link has expired. Please request a new one."}
              {status === "pending" &&
                "If you didn't receive an email, or if your link expired, you can request a new one below."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center">
            {status === "success" && (
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                Go to Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}

            {(status === "expired" ||
              status === "pending" ||
              status === "invalid" ||
              status === "error") && (
              <div className="w-full">
                <ResendVerificationForm initialEmail={email} />
              </div>
            )}
          </CardContent>

          {status !== "success" && (
            <CardFooter className="flex justify-center border-t p-4 text-center text-sm">
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Return to Sign In
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
