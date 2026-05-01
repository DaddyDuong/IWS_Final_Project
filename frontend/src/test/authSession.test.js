import { describe, expect, it } from 'vitest'
import {
  AUTH_STORAGE_KEY,
  normalizePersistedSession,
  sanitizeSessionToken,
  sanitizeSessionUser,
} from '../stores/authSession'

describe('auth session storage', () => {
  it('uses v2 auth storage key namespace', () => {
    expect(AUTH_STORAGE_KEY).toBe('iws-v2-auth-session')
  })

  it('sanitizes persisted token and user objects', () => {
    const session = normalizePersistedSession({
      token: '  token-value  ',
      user: {
        id: 'u-1',
        email: 'jane@example.com',
        fullName: 'Jane',
        role: 'manager',
      },
    })

    expect(session).toEqual({
      token: 'token-value',
      user: {
        id: 'u-1',
        email: 'jane@example.com',
        fullName: 'Jane',
        phone: '',
        role: 'manager',
        createdAt: null,
        updatedAt: null,
      },
    })
  })

  it('rejects invalid token and user records', () => {
    expect(sanitizeSessionToken('   ')).toBeNull()
    expect(sanitizeSessionUser({ id: '', email: '' })).toBeNull()
  })
})
