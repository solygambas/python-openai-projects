"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Github, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");
  const deletedParam = searchParams.get("deleted");
  
  const [error, setError] = useState<string | null>(
    errorParam === "CredentialsSignin" 
      ? "Invalid email or password" 
      : errorParam === "UserNotFound"
        ? "User profile not found. If this is a new account, please try signing in again."
        : errorParam 
          ? "An error occurred during sign in" 
          : null
  );
  const [success, setSuccess] = useState<string | null>(
    deletedParam === "true" ? "Account deleted successfully" : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const extractErrorText = (error: unknown): string => {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "";
    }
  };

  const isRateLimitError = (error: unknown): boolean => {
    if (typeof error === "object" && error !== null) {
      const maybeStatus = (error as { status?: unknown }).status;
      const maybeStatusCode = (error as { statusCode?: unknown }).statusCode;

      if (maybeStatus === 429 || maybeStatusCode === 429) {
        return true;
      }
    }

    const normalizedMessage = extractErrorText(error).toLowerCase();

    return (
      normalizedMessage.includes("429") ||
      normalizedMessage.includes("too many") ||
      normalizedMessage.includes("rate limit")
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        if (result.status === 429 || result.error === "RateLimited") {
          setError("Too many attempts. Please try again later.");
        } else if (result.error === "EmailNotVerified") {
          setError("Please verify your email address first. Check your inbox.");
        } else {
          setError("Invalid email or password");
        }
      } else if (result?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error: unknown) {
      if (isRateLimitError(error)) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Sign in failed. If you made multiple attempts, please wait a few minutes and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github", { callbackUrl });
    } catch {
      setError("Failed to sign in with GitHub.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign In to DevStash</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials or use GitHub to sign in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm p-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                placeholder="m@example.com"
                type="email"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="pl-10"
                required 
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          type="button" 
          className="w-full" 
          onClick={handleGithubSignIn}
          disabled={isLoading}
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-center w-full text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register for free
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
