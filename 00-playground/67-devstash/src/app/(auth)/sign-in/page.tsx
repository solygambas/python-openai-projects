import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center -mt-10">
      <Suspense fallback={<div className="w-full max-w-md h-[400px] animate-pulse bg-muted rounded-lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
