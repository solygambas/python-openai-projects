import { requireAuth } from '@/lib/auth-helpers';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | NextNotes',
  description: 'Your notes dashboard',
};

export default async function Dashboard() {
  const session = await requireAuth();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {session.user.name || session.user.email}
            </p>
          </div>
          <Link
            href="/notes/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          >
            ✏️ New Note
          </Link>
        </div>

        <div className="mt-12">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-600 dark:text-gray-400">
              No notes yet. <Link href="/notes/new" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Create your first note</Link> to get started.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}