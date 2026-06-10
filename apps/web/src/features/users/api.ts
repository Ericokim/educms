import type {
  CreateUserValues,
  Paginated,
  Role,
  UpdateUserValues,
  User,
} from '@educms/shared'
import { api } from '@/lib/api'

export interface UserListFilters {
  page?: number
  limit?: number
  role?: string
  search?: string
}

export function fetchUsers(filters: UserListFilters): Promise<Paginated<User>> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.role) params.set('role', filters.role)
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return api.get<Paginated<User>>(`/users${qs ? `?${qs}` : ''}`)
}

export function createUser(values: CreateUserValues): Promise<User> {
  return api.post<User>('/users', values)
}

export function updateUser(id: number, values: UpdateUserValues): Promise<User> {
  return api.patch<User>(`/users/${id}`, values)
}

export function changeRole(id: number, role: Role): Promise<User> {
  return api.patch<User>(`/users/${id}/role`, { role })
}

export function deactivateUser(id: number): Promise<User> {
  return api.patch<User>(`/users/${id}/deactivate`)
}

export function activateUser(id: number): Promise<User> {
  return api.patch<User>(`/users/${id}/activate`)
}
