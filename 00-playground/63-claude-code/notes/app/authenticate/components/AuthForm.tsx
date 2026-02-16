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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formState.email}
            onChange={(e) => handleEmailChange(e.currentTarget.value)}
            disabled={formState.isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formState.password}
            onChange={(e) => handlePasswordChange(e.currentTarget.value)}
            disabled={formState.isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
            required
          />
        </div>

        {formState.error && (
          <div
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          disabled={formState.isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-950"
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
        <span className="text-gray-600 dark:text-gray-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </span>
        <button
          onClick={toggleMode}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 dark:text-blue-400 dark:hover:text-blue-300 dark:focus:ring-offset-gray-950"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

export default AuthForm;
