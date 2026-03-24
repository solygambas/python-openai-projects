import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemDetailById } from "@/lib/db/items";

interface GetItemRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: Request,
  { params }: GetItemRouteContext
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await getItemDetailById(userId, id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET_ITEM_DETAIL_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
