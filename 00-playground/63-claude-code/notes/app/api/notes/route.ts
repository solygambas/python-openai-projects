import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { getDb } from '@/lib/db';
import { noteSchema } from '@/lib/schemas/notes';
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

    // Sanitize incoming user-generated input to avoid XSS and unsafe HTML
    const sanitized = {
      title: DOMPurify.sanitize(String(raw.title ?? ''), { ALLOWED_TAGS: [] }),
      content: DOMPurify.sanitize(String(raw.content ?? '')),
    };

    // Validate sanitized input
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

    const { title, content } = validationResult.data;
    const userId = session.user.id;
    const noteId = randomUUID();
    const now = new Date().toISOString();

    // Insert note into database
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO notes (id, user_id, title, content_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(noteId, userId, title, content, now, now);

    // Return created note
    return NextResponse.json(
      {
        id: noteId,
        title,
        content,
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
