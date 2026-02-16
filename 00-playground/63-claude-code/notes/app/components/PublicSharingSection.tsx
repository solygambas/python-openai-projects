"use client";

import { useCallback, useState } from "react";
import type { Note } from "@/lib/notes";

type PublicSharingSectionProps = {
  note: Note;
  onSharingStatusChange: (updatedNote: Note) => void;
};

export default function PublicSharingSection({
  note,
  onSharingStatusChange,
}: PublicSharingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const publicUrl =
    note.isPublic && note.publicSlug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${note.publicSlug}`
      : null;

  const handleTogglePublicSharing = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${note.id}/public`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !note.isPublic }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle public sharing");
      }

      const updatedNote = (await response.json()) as Note;
      onSharingStatusChange(updatedNote);
    } catch (err) {
      console.error("Error toggling public sharing:", err);
      setError("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  }, [note, onSharingStatusChange]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy URL to clipboard");
    }
  }, [publicUrl]);

  return (
    <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Public Sharing
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {note.isPublic
                ? "Anyone with the link can view this note"
                : "This note is private"}
            </p>
          </div>
          <button
            onClick={handleTogglePublicSharing}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              note.isPublic
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-300 hover:bg-gray-400"
            } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
            aria-label={
              note.isPublic ? "Disable public sharing" : "Enable public sharing"
            }
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                note.isPublic ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {note.isPublic && publicUrl && (
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleCopyToClipboard}
                className="rounded bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
              >
                {copiedToClipboard ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
