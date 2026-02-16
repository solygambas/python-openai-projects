"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NoteRenderer, { type TipTapDoc } from "@/app/components/NoteRenderer";
import type { Note } from "@/lib/notes";

type PublicNotePageProps = {
  params: Promise<{ slug: string }>;
};

function parseDoc(content: string): TipTapDoc | null {
  try {
    const parsed = JSON.parse(content) as TipTapDoc;
    if (parsed && parsed.type === "doc") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default function PublicNotePage({ params }: PublicNotePageProps) {
  const router = useRouter();
  const [paramsSlug, setParamsSlug] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params (it's a Promise in Next.js 15)
  useEffect(() => {
    params.then((p) => setParamsSlug(p.slug));
  }, [params]);

  // Fetch public note data
  useEffect(() => {
    if (!paramsSlug) return;

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/notes/public/${paramsSlug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This note is no longer available");
            return;
          }
          throw new Error("Failed to fetch note");
        }

        const data = (await response.json()) as Note;
        setNote(data);
      } catch (err) {
        console.error("Error fetching public note:", err);
        setError("Failed to load note");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [paramsSlug]);

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
            {error || "Note not found"}
          </div>
        </div>
      </main>
    );
  }

  const doc = parseDoc(note.content);
  const createdAt = new Date(note.createdAt);
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(createdAt);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Shared on {createdLabel}
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

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a shared public note. Read-only.</p>
        </div>
      </div>
    </main>
  );
}
