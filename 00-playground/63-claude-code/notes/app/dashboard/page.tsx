import { requireAuth } from '@/lib/auth-helpers';
import { getNotesByUser } from '@/lib/notes';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | NextNotes',
  description: 'Your notes dashboard',
};

export default async function Dashboard() {
  const session = await requireAuth();
  const notes = await getNotesByUser(session.user.id);

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

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
          {notes.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">
                No notes yet.{' '}
                <Link
                  href="/notes/new"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Create your first note
                </Link>{' '}
                to get started.
              </p>
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {note.title}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    {note.isPublic ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Shared
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}