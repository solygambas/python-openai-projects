import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes';
import { noteSchema, tipTapDocSchema } from '@/lib/schemas/notes';
import DOMPurify from 'isomorphic-dompurify';

type RouteParams = {
  id: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    const note = await getNoteById(session.user.id, id);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const existingNote = await getNoteById(session.user.id, id);
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const raw = await req.json();

    // Sanitize incoming title to avoid XSS
    const sanitized = {
      title: typeof raw?.title === 'string'
        ? DOMPurify.sanitize(raw.title, { ALLOWED_TAGS: [] })
        : undefined,
      content: raw?.content,
    };

    // Validate input
    const validationResult = noteSchema.safeParse(sanitized);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const emptyDoc = tipTapDocSchema.parse({ type: 'doc', content: [] });
    const normalizedTitle = (validationResult.data.title ?? '').trim();
    const title = normalizedTitle.length > 0 ? normalizedTitle : 'Untitled note';
    const content = validationResult.data.content ?? emptyDoc;
    const contentString = JSON.stringify(content);

    if (contentString.length > 50000) {
      return NextResponse.json(
        { error: 'Content cannot exceed 50000 characters' },
        { status: 400 }
      );
    }

    const updated = await updateNote(session.user.id, id, title, contentString);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      );
    }

    const updatedNote = await getNoteById(session.user.id, id);

    return NextResponse.json(updatedNote, { status: 200 });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const existingNote = await getNoteById(session.user.id, id);
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteNote(session.user.id, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
