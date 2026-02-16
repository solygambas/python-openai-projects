'use client';

import { useEditor } from '@tiptap/react';

type ToolbarProps = {
  editor: ReturnType<typeof useEditor>;
  editorState: {
    isBold: boolean;
    isItalic: boolean;
    isParagraph: boolean;
    isHeading1: boolean;
    isHeading2: boolean;
    isHeading3: boolean;
    isCode: boolean;
    isCodeBlock: boolean;
    isBulletList: boolean;
  };
  isSubmitting: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>, command: () => boolean) => void;
};

export function Toolbar({ editor, editorState, isSubmitting, onMouseDown }: ToolbarProps) {
  if (!editor) return null;

  const createButtonHandler = (command: () => boolean) => (e: React.MouseEvent<HTMLButtonElement>) =>
    onMouseDown(e, command);

  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
      {/* Text Formatting */}
      <button
        type="button"
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleBold().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isBold
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
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleItalic().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isItalic
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        title="Italic (Ctrl+I)"
        aria-label="Toggle italic"
      >
        <em>I</em>
      </button>
      <div className="border-r border-gray-300 dark:border-gray-600" />

      {/* Block Formatting */}
      <button
        type="button"
        onMouseDown={createButtonHandler(() => editor.chain().focus().setParagraph().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isParagraph
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
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isHeading1
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
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isHeading2
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
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isHeading3
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        title="Heading 3"
        aria-label="Toggle heading 3"
      >
        H3
      </button>

      <div className="border-r border-gray-300 dark:border-gray-600" />

      {/* Code Formatting */}
      <button
        type="button"
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleCode().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isCode
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
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleCodeBlock().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isCodeBlock
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        title="Code Block"
        aria-label="Toggle code block"
      >
        ⌨
      </button>

      <div className="border-r border-gray-300 dark:border-gray-600" />

      {/* Lists */}
      <button
        type="button"
        onMouseDown={createButtonHandler(() => editor.chain().focus().toggleBulletList().run())}
        disabled={isSubmitting}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          editorState.isBulletList
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        title="Bullet List"
        aria-label="Toggle bullet list"
      >
        •
      </button>

      <div className="border-r border-gray-300 dark:border-gray-600" />

      {/* Misc */}
      <button
        type="button"
        onMouseDown={createButtonHandler(() => editor.chain().focus().setHorizontalRule().run())}
        disabled={isSubmitting}
        className="rounded bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        title="Horizontal Rule"
        aria-label="Insert horizontal rule"
      >
        —
      </button>
    </div>
  );
}
