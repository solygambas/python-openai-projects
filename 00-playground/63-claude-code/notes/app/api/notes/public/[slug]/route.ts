import { NextRequest, NextResponse } from "next/server";
import { getNoteByPublicSlug } from "@/lib/notes";

type PublicNoteRouteParams = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: PublicNoteRouteParams
): Promise<NextResponse> {
  try {
    // Unwrap params
    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Fetch public note
    const note = await getNoteByPublicSlug(slug);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching public note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
