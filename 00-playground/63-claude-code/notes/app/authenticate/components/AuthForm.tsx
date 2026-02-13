'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';
import { loginSchema, signupSchema } from '@/lib/schemas/auth';
import type { LoginInput, SignupInput } from '@/lib/schemas/auth';

type Mode = 'login' | 'signup';

interface FormState {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
}

function AuthForm({ mode }: { mode: Mode }): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    error: null,
    isLoading: false,
  });

  const schema = mode === 'login' ? loginSchema : signupSchema;
  const isLogin = mode === 'login';

  function handleEmailChange(value: string): void {
    setFormState((prev) => ({ ...prev, email: value, error: null }));
  }

  function handlePasswordChange(value: string): void {
    setFormState((prev) => ({ ...prev, password: value, error: null }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parseResult = schema.safeParse({
      email: formState.email,
      password: formState.password,
    });

    if (!parseResult.success) {
      const [issue] = parseResult.error.issues;
      setFormState((prev) => ({
        ...prev,
        error: issue?.message ?? 'Validation error',
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (isLogin) {
        const data = parseResult.data as LoginInput;
        await signIn.email({
          email: data.email,
          password: data.password,
          callbackURL: '/dashboard',
        });
      } else {
        const data = parseResult.data as SignupInput;
        await signUp.email({
          email: data.email,
          password: data.password,
          name: data.email.split('@')[0] ?? 'User',
          callbackURL: '/dashboard',
        });
      }

      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }

  function toggleMode(): void {
    const newMode = isLogin ? 'signup' : 'login';
    const params = new URLSearchParams(searchParams);
    params.set('mode', newMode);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formState.email}
            onChange={(e) => handleEmailChange(e.currentTarget.value)}
            disabled={formState.isLoading}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formState.password}
            onChange={(e) => handlePasswordChange(e.currentTarget.value)}
            disabled={formState.isLoading}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
            required
          />
        </div>

        {formState.error && (
          <div
            className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive"
            role="alert"
          >
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          disabled={formState.isLoading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {formState.isLoading
            ? isLogin
              ? 'Signing in...'
              : 'Creating account...'
            : isLogin
              ? 'Sign In'
              : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </span>
        <button
          onClick={toggleMode}
          className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded px-1"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

export default AuthForm;
