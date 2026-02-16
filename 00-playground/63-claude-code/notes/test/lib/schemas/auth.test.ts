import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema } from '@/lib/schemas/auth'

describe('auth schemas', () => {
  it('valid login passes', () => {
    const ok = { email: 'a@b.com', password: 'secret' }
    expect(loginSchema.safeParse(ok).success).toBe(true)
  })

  it('invalid email fails', () => {
    const bad = { email: 'not-an-email', password: 'pass' }
    expect(loginSchema.safeParse(bad).success).toBe(false)
  })

  it('signup requires password length', () => {
    const short = { email: 'a@b.com', password: '123' }
    expect(signupSchema.safeParse(short).success).toBe(false)
  })
})
