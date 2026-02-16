import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PublicSharingSection from '@/app/components/PublicSharingSection'

describe('PublicSharingSection', () => {
  it('shows private message when not public', () => {
    const note = { id: 'n1', isPublic: false, publicSlug: null } as any
    render(<PublicSharingSection note={note} onSharingStatusChange={() => {}} />)
    expect(screen.getByText(/This note is private/)).toBeInTheDocument()
  })

  it('calls API to toggle sharing and calls callback on success', async () => {
    const note = { id: 'n2', isPublic: false, publicSlug: null } as any
    const updated = { ...note, isPublic: true, publicSlug: 's' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => updated } as any)
    const cb = vi.fn()
    render(<PublicSharingSection note={note} onSharingStatusChange={cb} />)

    const toggle = screen.getByRole('button', { name: /Enable public sharing/i })
    fireEvent.click(toggle)

    await waitFor(() => expect(cb).toHaveBeenCalled())
  })

  it('copies URL to clipboard when public', async () => {
    const note = { id: 'n3', isPublic: true, publicSlug: 'slug' } as any
    ;(globalThis as any).location = { origin: 'http://localhost' }
    const writeText = vi.fn().mockResolvedValue(undefined)
    ;(globalThis as any).navigator = { clipboard: { writeText } }

    render(<PublicSharingSection note={note} onSharingStatusChange={() => {}} />)
    const copyBtn = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyBtn)

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost/p/slug'))
  })
})
