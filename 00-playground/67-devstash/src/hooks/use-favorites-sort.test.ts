import { describe, it, expect } from "vitest";
import { sortItems, sortCollections } from "./use-favorites-sort";
import type { FavoriteItem, FavoriteCollection } from "./use-favorites-sort";

const makeItem = (
  id: string,
  title: string,
  typeName: string,
  updatedAt: Date,
): FavoriteItem => ({
  id,
  title,
  itemType: { name: typeName, icon: "Code", color: "#000" },
  updatedAt,
});

const makeCollection = (
  id: string,
  name: string,
  updatedAt: Date,
): FavoriteCollection => ({
  id,
  name,
  updatedAt,
  _count: { items: 0 },
});

describe("sortItems", () => {
  const items: FavoriteItem[] = [
    makeItem("1", "Zebra note", "note", new Date("2025-01-01")),
    makeItem("2", "Alpha snippet", "snippet", new Date("2025-03-01")),
    makeItem("3", "Mango command", "command", new Date("2025-02-01")),
    makeItem("4", "Beta prompt", "prompt", new Date("2025-04-01")),
  ];

  it("sorts newest first", () => {
    const result = sortItems(items, "newest");
    expect(result.map((i) => i.id)).toEqual(["4", "2", "3", "1"]);
  });

  it("sorts oldest first", () => {
    const result = sortItems(items, "oldest");
    expect(result.map((i) => i.id)).toEqual(["1", "3", "2", "4"]);
  });

  it("sorts by name A-Z", () => {
    const result = sortItems(items, "name-asc");
    expect(result.map((i) => i.title)).toEqual([
      "Alpha snippet",
      "Beta prompt",
      "Mango command",
      "Zebra note",
    ]);
  });

  it("sorts by name Z-A", () => {
    const result = sortItems(items, "name-desc");
    expect(result.map((i) => i.title)).toEqual([
      "Zebra note",
      "Mango command",
      "Beta prompt",
      "Alpha snippet",
    ]);
  });

  it("sorts by type using canonical order", () => {
    const result = sortItems(items, "type");
    // Order: snippet(0), prompt(1), command(2), note(3)
    expect(result.map((i) => i.itemType.name)).toEqual([
      "snippet",
      "prompt",
      "command",
      "note",
    ]);
  });

  it("sorts by type, then by name for ties", () => {
    const tiedItems: FavoriteItem[] = [
      makeItem("a", "Zebra", "snippet", new Date("2025-01-01")),
      makeItem("b", "Alpha", "snippet", new Date("2025-01-01")),
    ];
    const result = sortItems(tiedItems, "type");
    expect(result.map((i) => i.title)).toEqual(["Alpha", "Zebra"]);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    sortItems(items, "name-asc");
    expect(items).toEqual(original);
  });

  it("handles an empty array", () => {
    expect(sortItems([], "newest")).toEqual([]);
  });
});

describe("sortCollections", () => {
  const collections: FavoriteCollection[] = [
    makeCollection("1", "Zebra", new Date("2025-01-01")),
    makeCollection("2", "Alpha", new Date("2025-03-01")),
    makeCollection("3", "Mango", new Date("2025-02-01")),
  ];

  it("sorts newest first", () => {
    const result = sortCollections(collections, "newest");
    expect(result.map((c) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts oldest first", () => {
    const result = sortCollections(collections, "oldest");
    expect(result.map((c) => c.id)).toEqual(["1", "3", "2"]);
  });

  it("sorts by name A-Z", () => {
    const result = sortCollections(collections, "name-asc");
    expect(result.map((c) => c.name)).toEqual(["Alpha", "Mango", "Zebra"]);
  });

  it("sorts by name Z-A", () => {
    const result = sortCollections(collections, "name-desc");
    expect(result.map((c) => c.name)).toEqual(["Zebra", "Mango", "Alpha"]);
  });

  it("does not mutate the original array", () => {
    const original = [...collections];
    sortCollections(collections, "name-asc");
    expect(collections).toEqual(original);
  });

  it("handles an empty array", () => {
    expect(sortCollections([], "newest")).toEqual([]);
  });
});
