import { describe, it, expect, vi } from "vitest";
import { afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock NoteRenderer to keep test focused on parsing behavior
vi.mock("@/app/components/NoteRenderer", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="note-renderer">rendered</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("parseDoc behavior via NotePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders NoteRenderer when content is valid TipTap doc JSON", async () => {
    const note = {
      id: "1",
      title: "T",
      content: JSON.stringify({ type: "doc", content: [] }),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => note,
    } as any);

    const { default: NotePage } = await import("@/app/notes/[id]/page");

    render(<NotePage params={Promise.resolve({ id: "1" })} />);

    await waitFor(() =>
      expect(screen.getByTestId("note-renderer")).toBeInTheDocument()
    );
  });

  it("shows fallback message when content is invalid JSON", async () => {
    const note = {
      id: "2",
      title: "T",
      content: "not a json",
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => note,
    } as any);

    const { default: NotePage } = await import("@/app/notes/[id]/page");

    render(<NotePage params={Promise.resolve({ id: "2" })} />);

    await waitFor(() =>
      expect(screen.getByText(/could not be rendered/i)).toBeInTheDocument()
    );
  });
});
