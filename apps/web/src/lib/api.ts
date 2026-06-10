import type { ApiFieldError, ApiResponse } from '@educms/shared'
import { getToken } from './auth-token'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export class ApiClientError extends Error {
  readonly status: number
  readonly errors: ApiFieldError[]

  constructor(message: string, status: number, errors: ApiFieldError[] = []) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiClientError('Cannot reach the server. Check your connection.', 0)
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!response.ok || !body || !body.success) {
    throw new ApiClientError(
      body?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body && !body.success ? body.errors : []
    )
  }

  return body.data
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : 'Something went wrong. Please try again.'
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
