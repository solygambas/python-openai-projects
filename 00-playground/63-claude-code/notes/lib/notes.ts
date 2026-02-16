import { get, query, run } from '@/lib/db';

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteListItem = {
  id: string;
  title: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

type NoteListRow = {
  id: string;
  title: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNoteListRow(row: NoteListRow): NoteListItem {
  return {
    id: row.id,
    title: row.title,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNoteById(userId: string, noteId: string): Promise<Note | null> {

  const row = get<NoteRow>(
    `
      SELECT id, user_id, title, content, is_public, public_slug, created_at, updated_at
      FROM notes
      WHERE user_id = ? AND id = ?
      LIMIT 1
    `,
    [userId, noteId]
  );

  if (!row) {
    return null;
  }

  return mapNoteRow(row);
}

export async function getNotesByUser(userId: string): Promise<NoteListItem[]> {
  const rows = query<NoteListRow>(
    `
      SELECT id, title, is_public, public_slug, created_at, updated_at
      FROM notes
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `,
    [userId]
  );

  return rows.map(mapNoteListRow);
}

export async function updateNote(
  userId: string,
  noteId: string,
  title: string,
  content: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = run(
    `
      UPDATE notes
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
    [title, content, now, noteId, userId]
  );

  return result.changes > 0;
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  const result = run(
    `
      DELETE FROM notes
      WHERE id = ? AND user_id = ?
    `,
    [noteId, userId]
  );

  return result.changes > 0;
}

