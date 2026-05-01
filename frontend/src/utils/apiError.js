export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.message
    ?? error?.response?.data?.error?.message
    ?? error?.message

  if (typeof message !== 'string') {
    return fallback
  }

  const normalized = message.trim()
  return normalized.length > 0 ? normalized : fallback
}

export function getApiErrorCode(error) {
  return error?.response?.data?.code ?? null
}
