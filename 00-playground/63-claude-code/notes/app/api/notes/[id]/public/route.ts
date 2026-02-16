import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";
import { togglePublicSharing } from "@/lib/notes";
import { publicToggleSchema } from "@/lib/schemas/notes";

type PublicRouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  req: NextRequest,
  { params }: PublicRouteParams
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Unwrap params
    const { id } = await params;

    // Parse request body
    const raw = await req.json();

    // Validate input
    const validationResult = publicToggleSchema.safeParse(raw);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { isPublic } = validationResult.data;

    // Toggle public sharing
    const updatedNote = await togglePublicSharing(
      session.user.id,
      id,
      isPublic
    );

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error toggling public sharing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
