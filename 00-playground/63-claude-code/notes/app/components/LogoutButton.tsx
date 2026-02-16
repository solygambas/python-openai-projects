'use client';

import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React from 'react';

interface LogoutButtonProps {
  email?: string;
}

export default function LogoutButton({ email }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleLogout: React.SubmitEventHandler<HTMLFormElement> = React.useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/authenticate');
            },
          },
        });
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <form onSubmit={handleLogout} className="flex items-center gap-4">
      {email && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {email}
        </span>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-offset-gray-950"
      >
        {isLoading ? 'Logging out...' : 'Logout'}
      </button>
    </form>
  );
}
