import NoteRenderer, { type TipTapDoc } from '@/app/components/NoteRenderer';
import { requireAuth } from '@/lib/auth-helpers';
import { getNoteById } from '@/lib/notes';
import { notFound } from 'next/navigation';

type NotePageProps = {
  params: Promise<{ id: string }>;
};

function parseDoc(content: string): TipTapDoc | null {
  try {
    const parsed = JSON.parse(content) as TipTapDoc;
    if (parsed && parsed.type === 'doc') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const session = await requireAuth();
  if (typeof id !== 'string' || id.length === 0) {
    notFound();
  }

  const note = await getNoteById(session.user.id, id);

  if (!note) {
    notFound();
  }

  const doc = parseDoc(note.content);
  const updatedAt = new Date(note.updatedAt);
  const updatedLabel = Number.isNaN(updatedAt.getTime())
    ? 'Unknown date'
    : new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(updatedAt);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Last updated {updatedLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {note.title}
          </h1>
        </header>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {doc ? (
            <NoteRenderer doc={doc} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This note could not be rendered.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}