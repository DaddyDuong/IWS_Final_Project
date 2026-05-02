function decodeBase64Url(payload) {
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

export function getTokenExp(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const sections = token.split('.')
  if (sections.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(sections[1]))
    return Number.isFinite(payload.exp) ? payload.exp : null
  } catch {
    return null
  }
}

export function isTokenValid(token, nowMs = Date.now()) {
  const exp = getTokenExp(token)
  if (!exp) {
    return false
  }

  return exp > Math.floor(nowMs / 1000)
}

export function sanitizeToken(token) {
  return isTokenValid(token) ? token : null
}
