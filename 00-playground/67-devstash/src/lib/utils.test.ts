import { describe, expect, it } from "vitest";
import { getPageNumbers } from "@/components/ui/pagination-controls";

describe("getPageNumbers", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("adds ellipsis after page 1 when currentPage > 3", () => {
    const pages = getPageNumbers(5, 10);
    expect(pages[0]).toBe(1);
    expect(pages[1]).toBe("...");
  });

  it("adds ellipsis before last page when currentPage < totalPages - 2", () => {
    const pages = getPageNumbers(5, 10);
    expect(pages[pages.length - 1]).toBe(10);
    expect(pages[pages.length - 2]).toBe("...");
  });

  it("always includes first and last page", () => {
    const pages = getPageNumbers(5, 20);
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(20);
  });

  it("shows neighbours around currentPage", () => {
    const pages = getPageNumbers(5, 20);
    expect(pages).toContain(4);
    expect(pages).toContain(5);
    expect(pages).toContain(6);
  });

  it("no leading ellipsis when currentPage is close to start", () => {
    const pages = getPageNumbers(2, 10);
    expect(pages[1]).not.toBe("...");
  });

  it("no trailing ellipsis when currentPage is close to end", () => {
    const pages = getPageNumbers(9, 10);
    expect(pages[pages.length - 2]).not.toBe("...");
  });
});
