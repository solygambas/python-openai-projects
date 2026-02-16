'use client';

import { useCallback, useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRouter } from 'next/navigation';
import type { Note } from '@/lib/notes';

type NoteFormProps = {
  note?: Note;
  onSaveComplete?: () => void;
};

export default function NoteForm({ note, onSaveComplete }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setEditorRerender] = useState(0);

  const isEditMode = !!note;

  // Parse note content (it's stored as JSON string)
  let initialContent = { type: 'doc', content: [] };
  if (isEditMode && note) {
    try {
      const parsed = JSON.parse(note.content);
      if (parsed && parsed.type === 'doc') {
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
        class: 'prose prose-invert max-w-none focus:outline-none rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[200px]',
      },
    },
  });

  // Force component re-render when editor updates (for toolbar state)
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setEditorRerender((prev) => prev + 1);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!editor) {
        setError('Editor is still loading. Please try again.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Sanitize title input before sending to the server
        const cleanTitle = DOMPurify.sanitize(title.trim(), { ALLOWED_TAGS: [] });
        const content = editor.getJSON();

        const url = isEditMode ? `/api/notes/${note!.id}` : '/api/notes';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: cleanTitle,
            content,
          }),
        });

        if (!response.ok) {
          // For server errors show a generic message; show server-provided message for client errors
          if (response.status >= 500) {
            setError('Server error. Please try again later.');
            console.error('Server returned status', response.status);
            return;
          }

          const errorData = await response.json().catch(() => null);
          setError(errorData?.error ?? (isEditMode ? 'Failed to save note.' : 'Failed to create note.'));
          return;
        }

        // Handle success
        if (isEditMode) {
          // For edit mode, call callback if provided
          if (onSaveComplete) {
            onSaveComplete();
          }
        } else {
          // For create mode, redirect to the new note
          const data = await response.json();
          router.push(`/notes/${data.id}`);
        }
      } catch (err) {
        console.error('Form submission error:', err);
        setError(isEditMode ? 'Could not save note. Please try again.' : 'Could not create note. Please try again.');
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

  return (
    <div className={isEditMode ? 'w-full space-y-6' : 'mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8'}>
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
            className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
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
                <p className="text-gray-500 dark:text-gray-400">Loading editor...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBold().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('bold')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Bold (Ctrl+B)"
                    aria-label="Toggle bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleItalic().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('italic')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Italic (Ctrl+I)"
                    aria-label="Toggle italic"
                  >
                    <em>I</em>
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().setParagraph().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('paragraph')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Paragraph"
                    aria-label="Normal text"
                  >
                    ¶
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('heading', { level: 1 })
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Heading 1"
                    aria-label="Toggle heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('heading', { level: 2 })
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Heading 2"
                    aria-label="Toggle heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('heading', { level: 3 })
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Heading 3"
                    aria-label="Toggle heading 3"
                  >
                    H3
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleCode().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('code')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Inline Code"
                    aria-label="Toggle inline code"
                  >
                    <code className="text-xs">&lt;/&gt;</code>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleCodeBlock().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('codeBlock')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Code Block"
                    aria-label="Toggle code block"
                  >
                    ⌨
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBulletList().run();
                    }}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('bulletList')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Bullet List"
                    aria-label="Toggle bullet list"
                  >
                    •
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().setHorizontalRule().run();
                    }}
                    disabled={isSubmitting}
                    className="rounded bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    title="Horizontal Rule"
                    aria-label="Insert horizontal rule"
                  >
                    —
                  </button>
                </div>

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
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-950"
          >
            {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Note')}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
