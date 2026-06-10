import type { AuthData, LoginPayload, User } from '@educms/shared'
import { api } from '@/lib/api'

export function loginRequest(payload: LoginPayload): Promise<AuthData> {
  return api.post<AuthData>('/auth/login', payload)
}

export async function fetchMe(): Promise<User> {
  const data = await api.get<{ user: User }>('/auth/me')
  return data.user
}

export function logoutRequest(): Promise<null> {
  return api.post<null>('/auth/logout')
}
