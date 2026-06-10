const TOKEN_KEY = 'educms_token'

// Tiny external store so React can subscribe to token changes via
// useSyncExternalStore instead of mirroring localStorage into state.
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function hasToken(): boolean {
  return getToken() !== null
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  emit()
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  emit()
}
