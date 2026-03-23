import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResetPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token as string | undefined;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center -mt-10 px-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-6 rounded-md flex flex-col items-center gap-4 max-w-md w-full">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold text-base">Missing Reset Token</p>
          </div>
          <p className="text-center text-muted-foreground">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link 
            href="/forgot-password" 
            title="Request new link"
            className={cn(buttonVariants({ variant: "outline" }), "mt-2")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center -mt-10 px-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
