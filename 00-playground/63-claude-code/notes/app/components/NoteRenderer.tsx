import type { ReactNode } from 'react';

type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TipTapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
};

export type TipTapDoc = {
  type: 'doc';
  content?: TipTapNode[];
};

type NoteRendererProps = {
  doc: TipTapDoc;
};

function getTextContent(node: TipTapNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (!node.content) {
    return '';
  }

  return node.content.map(getTextContent).join('');
}

function renderMarks(text: ReactNode, marks: TipTapMark[] | undefined): ReactNode {
  if (!marks || marks.length === 0) {
    return text;
  }

  return marks.reduce<ReactNode>((acc, mark, index) => {
    switch (mark.type) {
      case 'bold':
        return (
          <strong key={index} className="font-semibold text-gray-900 dark:text-gray-50">
            {acc}
          </strong>
        );
      case 'italic':
        return (
          <em key={index} className="italic text-gray-800 dark:text-gray-200">
            {acc}
          </em>
        );
      case 'code':
        return (
          <code
            key={index}
            className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          >
            {acc}
          </code>
        );
      default:
        return acc;
    }
  }, text);
}

function renderChildren(nodes: TipTapNode[] | undefined): ReactNode {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  return nodes.map((node, index) => renderNode(node, index));
}

function renderNode(node: TipTapNode, key: number): ReactNode {
  switch (node.type) {
    case 'text':
      return (
        <span key={key}>
          {renderMarks(node.text ?? '', node.marks)}
        </span>
      );
    case 'paragraph':
      return (
        <p key={key} className="leading-7 text-gray-800 dark:text-gray-200">
          {renderChildren(node.content)}
        </p>
      );
    case 'heading': {
      const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 2;
      const children = renderChildren(node.content);
      if (level === 1) {
        return (
          <h1 key={key} className="text-3xl font-bold text-gray-900 dark:text-white">
            {children}
          </h1>
        );
      }
      if (level === 2) {
        return (
          <h2 key={key} className="text-2xl font-semibold text-gray-900 dark:text-white">
            {children}
          </h2>
        );
      }
      return (
        <h3 key={key} className="text-xl font-semibold text-gray-900 dark:text-white">
          {children}
        </h3>
      );
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc space-y-1 pl-6 text-gray-800 dark:text-gray-200">
          {renderChildren(node.content)}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal space-y-1 pl-6 text-gray-800 dark:text-gray-200">
          {renderChildren(node.content)}
        </ol>
      );
    case 'listItem':
      return (
        <li key={key} className="leading-7">
          {renderChildren(node.content)}
        </li>
      );
    case 'codeBlock': {
      const codeText = getTextContent(node);
      return (
        <pre key={key} className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
          <code>{codeText}</code>
        </pre>
      );
    }
    case 'horizontalRule':
      return <hr key={key} className="my-6 border-gray-200 dark:border-gray-800" />;
    case 'hardBreak':
      return <br key={key} />;
    default:
      return <div key={key}>{renderChildren(node.content)}</div>;
  }
}

export default function NoteRenderer({ doc }: NoteRendererProps) {
  return <div className="space-y-4">{renderChildren(doc.content)}</div>;
}
