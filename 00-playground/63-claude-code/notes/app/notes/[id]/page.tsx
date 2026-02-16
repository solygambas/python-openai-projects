'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NoteRenderer, { type TipTapDoc } from '@/app/components/NoteRenderer';
import NoteForm from '@/app/components/NoteForm';
import type { Note } from '@/lib/notes';

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

export default function NotePage({ params }: NotePageProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [paramsId, setParamsId] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params (it's a Promise in Next.js 15)
  useEffect(() => {
    params.then((p) => setParamsId(p.id));
  }, [params]);

  // Fetch note data
  useEffect(() => {
    if (!paramsId) return;

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/notes/${paramsId}`);

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to fetch note');
        }

        const data = await response.json() as Note;
        setNote(data);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [paramsId, router]);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveComplete = useCallback(() => {
    setIsEditing(false);
    // Refetch the note to get updated data
    if (paramsId) {
      fetch(`/api/notes/${paramsId}`)
        .then((res) => res.json())
        .then((data: Note) => setNote(data))
        .catch((err) => console.error('Error refetching note:', err));
    }
  }, [paramsId]);

  const handleDeleteClick = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!note) return;

    dialogRef.current?.close();
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
      setIsDeleting(false);
    }
  }, [note, router]);

  const handleCancelDelete = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Loading note...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !note) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error || 'Note not found'}
          </div>
        </div>
      </main>
    );
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
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            disabled={isDeleting}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Dashboard
          </button>
        </div>

        {isEditing && note ? (
          // Edit Mode
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Note
              </h1>
            </div>
            <NoteForm
              note={note}
              onSaveComplete={handleSaveComplete}
            />
          </>
        ) : (
          // View Mode
          <>
            <header className="mb-8">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Last updated {updatedLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {note.title}
              </h1>
              
              {/* Edit and Delete Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/20 dark:focus:ring-offset-gray-950"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
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
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <div className="grid place-items-center">
        <dialog
          ref={dialogRef}
          className="rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Note
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </dialog></div>
      </div>
    </main>
  );
}