import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteRenderer from "@/app/components/NoteRenderer";

describe("NoteRenderer", () => {
  it("renders paragraph and heading and code block", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
        {
          type: "codeBlock",
          content: [{ type: "text", text: "console.log(1)" }],
        },
      ],
    };

    render(<NoteRenderer doc={doc as any} />);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("console.log(1)")).toBeInTheDocument();
  });

  it("renders marks (bold, italic, code)", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "B", marks: [{ type: "bold" }] },
            { type: "text", text: "I", marks: [{ type: "italic" }] },
            { type: "text", text: "C", marks: [{ type: "code" }] },
          ],
        },
      ],
    };

    render(<NoteRenderer doc={doc as any} />);

    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});
