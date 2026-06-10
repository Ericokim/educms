import type { CommentItem, Paginated } from '@educms/shared'
import { api } from '@/lib/api'

export interface CommentListFilters {
  page?: number
  limit?: number
  status?: string
}

export function fetchComments(filters: CommentListFilters): Promise<Paginated<CommentItem>> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  const qs = params.toString()
  return api.get<Paginated<CommentItem>>(`/comments${qs ? `?${qs}` : ''}`)
}

export function approveComment(id: number): Promise<CommentItem> {
  return api.patch<CommentItem>(`/comments/${id}/approve`)
}

export function spamComment(id: number): Promise<CommentItem> {
  return api.patch<CommentItem>(`/comments/${id}/spam`)
}

export function trashComment(id: number): Promise<CommentItem> {
  return api.patch<CommentItem>(`/comments/${id}/trash`)
}
