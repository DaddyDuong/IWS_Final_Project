import { describe, expect, it } from 'vitest'
import { isTokenValid } from './authToken'

function buildToken(exp) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp }))
  return `${header}.${payload}.signature`
}

describe('isTokenValid', () => {
  it('returns true for a token with future exp', () => {
    const token = buildToken(Math.floor(Date.now() / 1000) + 300)
    expect(isTokenValid(token)).toBe(true)
  })

  it('returns false for expired token', () => {
    const token = buildToken(Math.floor(Date.now() / 1000) - 60)
    expect(isTokenValid(token)).toBe(false)
  })

  it('returns false for malformed tokens', () => {
    expect(isTokenValid('not-a-jwt')).toBe(false)
    expect(isTokenValid('')).toBe(false)
  })

  it('returns false when exp is missing', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ sub: '123' }))
    const token = `${header}.${payload}.signature`
    expect(isTokenValid(token)).toBe(false)
  })
})
