import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { getDb } from '@/lib/db';
import { noteSchema, tipTapDocSchema } from '@/lib/schemas/notes';
import { randomUUID } from 'node:crypto';
import DOMPurify from 'isomorphic-dompurify';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const raw = await req.json();

    // Sanitize incoming user-generated title input to avoid XSS and unsafe HTML
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
    const userId = session.user.id;
    const noteId = randomUUID();
    const now = new Date().toISOString();

    // Insert note into database
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(noteId, userId, title, contentString, now, now);

    // Return created note
    return NextResponse.json(
      {
        id: noteId,
        title,
        content: contentString,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      { status: 201 }
    );
  } catch (error) {
    // Log full error server-side for debugging, but never return internal error details to clients
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
