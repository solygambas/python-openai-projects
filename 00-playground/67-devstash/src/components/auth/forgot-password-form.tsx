"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
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

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we&apos;ll send you a link to reset your password.
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
        
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center w-full text-muted-foreground">
          <Link 
            href="/sign-in" 
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
