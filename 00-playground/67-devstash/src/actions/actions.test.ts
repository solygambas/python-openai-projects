import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, updateItemQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  updateItemQueryMock: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/db/items', () => ({
  updateItem: updateItemQueryMock,
}));

import { updateItem } from '@/actions/items';

describe('actions/updateItem', () => {
  beforeEach(() => {
    authMock.mockReset();
    updateItemQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it('returns unauthorized when no session user id exists', async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await updateItem({
      itemId: 'item-1',
      title: 'Valid title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: 'Unauthorized',
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it('returns zod validation error when title is empty after trim', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const result = await updateItem({
      itemId: 'item-1',
      title: '   ',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: 'Title is required',
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it('returns zod validation error when url is invalid', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const result = await updateItem({
      itemId: 'item-1',
      title: 'Valid title',
      description: null,
      content: null,
      url: 'not-a-url',
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: 'Invalid URL format',
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it('calls query with normalized optional fields and returns success payload', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const updatedItem = {
      id: 'item-1',
      title: 'Updated title',
      description: null,
      contentType: 'TEXT',
      content: null,
      url: null,
      language: null,
      isFavorite: false,
      isPinned: true,
      createdAt: new Date('2026-03-20T10:00:00.000Z'),
      updatedAt: new Date('2026-03-20T12:00:00.000Z'),
      itemType: {
        id: 'type-1',
        name: 'Snippet',
        icon: 'Code',
        color: '#3b82f6',
      },
      tags: [{ id: 'tag-1', name: 'tag1' }],
      collections: [{ collection: { id: 'col-1', name: 'Main' } }],
    };

    updateItemQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await updateItem({
      itemId: 'item-1',
      title: 'Updated title',
      description: '',
      content: '',
      url: '',
      language: '   ',
      tags: ['tag1'],
    });

    expect(updateItemQueryMock).toHaveBeenCalledWith('user-1', 'item-1', {
      title: 'Updated title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ['tag1'],
    });

    expect(result).toEqual({
      success: true,
      data: updatedItem,
    });
  });

  it('returns generic error when update query throws', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    updateItemQueryMock.mockRejectedValueOnce(new Error('db unavailable'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await updateItem({
      itemId: 'item-1',
      title: 'Updated title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: 'Failed to update item',
    });
  });
});
