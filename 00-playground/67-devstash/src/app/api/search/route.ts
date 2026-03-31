import { auth } from "@/auth";
import { getAllItemsForSearch } from "@/lib/db/items";
import { getAllCollectionsForSearch } from "@/lib/db/collections";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, collections] = await Promise.all([
    getAllItemsForSearch(userId),
    getAllCollectionsForSearch(userId),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: "item" as const,
      itemType: item.itemType,
    })),
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      itemCount: collection._count.items,
      type: "collection" as const,
    })),
  });
}
