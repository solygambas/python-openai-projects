'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function NewNoteForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start typing your note here...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white',
      },
    },
  });

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!editor || editor.isEmpty) {
        setError('Content is required');
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            content: editor.getHTML(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create note');
        }

        const data = await response.json();
        router.push(`/notes/${data.id}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        console.error('Form submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, editor, router]
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Note
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Write and format your note with rich text editing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {error}
          </div>
        )}

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
            autoFocus
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
                    onClick={() => editor.chain().focus().toggleBold().run()}
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
                    onClick={() => editor.chain().focus().toggleItalic().run()}
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
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('strike')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Strikethrough"
                    aria-label="Toggle strikethrough"
                  >
                    <s>S</s>
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
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
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
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
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
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
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('orderedList')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Ordered List"
                    aria-label="Toggle ordered list"
                  >
                    1.
                  </button>
                  <div className="border-r border-gray-300 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      editor.isActive('codeBlock')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Code Block"
                    aria-label="Toggle code block"
                  >
                    &lt;&gt;
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
            {isSubmitting ? 'Creating...' : 'Create Note'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
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
