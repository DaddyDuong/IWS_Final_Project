export const AUTH_STORAGE_KEY = 'iws-v2-auth-session'

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeSessionToken(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function sanitizeSessionUser(user) {
  if (!isPlainObject(user)) {
    return null
  }

  if (typeof user.id !== 'string' || user.id.trim() === '') {
    return null
  }

  if (typeof user.email !== 'string' || user.email.trim() === '') {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    fullName: typeof user.fullName === 'string' ? user.fullName : '',
    phone: typeof user.phone === 'string' ? user.phone : '',
    role: typeof user.role === 'string' ? user.role : 'customer',
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  }
}

export function normalizePersistedSession(persistedState) {
  const token = sanitizeSessionToken(persistedState?.token)
  const user = sanitizeSessionUser(persistedState?.user)

  return {
    token,
    user,
  }
}
