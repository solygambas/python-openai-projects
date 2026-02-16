"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/notes";
import { Toolbar } from "./Toolbar";
import { sanitizeAndValidateNote } from "@/lib/utils/note-validation";
import { createOrUpdateNote } from "@/lib/api/notes-client";

type NoteFormProps = {
  note?: Note;
  onSaveComplete?: () => void;
};

export default function NoteForm({ note, onSaveComplete }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!note;

  // Parse note content (it's stored as JSON string)
  let initialContent = { type: "doc", content: [] };
  if (isEditMode && note) {
    try {
      const parsed = JSON.parse(note.content);
      if (parsed && parsed.type === "doc") {
        initialContent = parsed;
      }
    } catch {
      // Keep default empty doc on parse error
    }
  }

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    editable: true,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[200px] [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:my-2 [&_p]:my-1",
      },
    },
  });

  // Use TipTap's useEditorState hook for efficient toolbar state updates
  const editorStateRaw = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,
      isParagraph: editor?.isActive("paragraph") ?? false,
      isHeading1: editor?.isActive("heading", { level: 1 }) ?? false,
      isHeading2: editor?.isActive("heading", { level: 2 }) ?? false,
      isHeading3: editor?.isActive("heading", { level: 3 }) ?? false,
      isCode: editor?.isActive("code") ?? false,
      isCodeBlock: editor?.isActive("codeBlock") ?? false,
      isBulletList: editor?.isActive("bulletList") ?? false,
    }),
  });

  // Provide default values when editorState is null
  const editorState = editorStateRaw ?? {
    isBold: false,
    isItalic: false,
    isParagraph: false,
    isHeading1: false,
    isHeading2: false,
    isHeading3: false,
    isCode: false,
    isCodeBlock: false,
    isBulletList: false,
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!editor) {
        setError("Editor is still loading. Please try again.");
        return;
      }

      setIsSubmitting(true);

      try {
        const content = editor.getJSON();

        const validation = sanitizeAndValidateNote(title, content);
        if (!validation.success) {
          // validation.error can be a ZodError or other error
          setError("Invalid input");
          setIsSubmitting(false);
          return;
        }

        const { title: cleanTitle, content: contentString } = validation.value;

        const resp = await createOrUpdateNote({
          noteId: isEditMode ? note!.id : undefined,
          title: cleanTitle,
          content,
        });

        if (!resp.ok) {
          if (resp.status >= 500) {
            setError("Server error. Please try again later.");
            console.error("Server returned status", resp.status);
            return;
          }

          const errorData = await resp.json().catch(() => null);
          setError(
            errorData?.error ??
              (isEditMode ? "Failed to save note." : "Failed to create note.")
          );
          return;
        }

        if (isEditMode) {
          if (onSaveComplete) onSaveComplete();
        } else {
          const data = await resp.json();
          router.push(`/notes/${data.id}`);
        }
      } catch (err) {
        console.error("Form submission error:", err);
        setError(
          isEditMode
            ? "Could not save note. Please try again."
            : "Could not create note. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, editor, isEditMode, note, onSaveComplete, router]
  );

  const handleCancel = () => {
    if (isEditMode) {
      window.location.reload();
    } else {
      router.back();
    }
  };

  // Memoize toolbar button handlers to ensure consistent focus behavior
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, command: () => boolean) => {
      e.preventDefault();
      command();
    },
    []
  );

  return (
    <div
      className={
        isEditMode
          ? "w-full space-y-6"
          : "mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      }
    >
      {!isEditMode && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Note
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Write and format your note with rich text editing
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title"
            disabled={isSubmitting}
            maxLength={255}
            className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {title.length}/255
          </p>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Content
          </label>
          <div className="mt-2">
            {!editor ? (
              <div className="flex items-center justify-center rounded-md border border-gray-300 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Loading editor...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Toolbar */}
                <Toolbar
                  editor={editor}
                  editorState={editorState}
                  isSubmitting={isSubmitting}
                  onMouseDown={handleMouseDown}
                />

                {/* Editor */}
                <EditorContent editor={editor} />
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-950"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Note"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
