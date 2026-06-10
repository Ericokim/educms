import type {
  CategorySummary,
  Paginated,
  PostDetail,
  PostFormValues,
  PostListItem,
  PostVersionSummary,
  TagSummary,
} from '@educms/shared'
import { api } from '@/lib/api'

export interface PostListFilters {
  page?: number
  limit?: number
  status?: string
  categoryId?: number
  search?: string
}

export function fetchPosts(filters: PostListFilters): Promise<Paginated<PostListItem>> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return api.get<Paginated<PostListItem>>(`/posts${qs ? `?${qs}` : ''}`)
}

export function fetchPost(id: number): Promise<PostDetail> {
  return api.get<PostDetail>(`/posts/${id}`)
}

export function createPost(values: PostFormValues): Promise<PostDetail> {
  return api.post<PostDetail>('/posts', values)
}

export function updatePost(id: number, values: PostFormValues): Promise<PostDetail> {
  return api.patch<PostDetail>(`/posts/${id}`, values)
}

export function publishPost(id: number): Promise<PostDetail> {
  return api.patch<PostDetail>(`/posts/${id}/publish`)
}

export function archivePost(id: number): Promise<PostDetail> {
  return api.patch<PostDetail>(`/posts/${id}/archive`)
}

export function deletePost(id: number): Promise<null> {
  return api.delete<null>(`/posts/${id}`)
}

export function fetchVersions(id: number): Promise<PostVersionSummary[]> {
  return api.get<PostVersionSummary[]>(`/posts/${id}/versions`)
}

export function rollbackPost(id: number, versionId: number): Promise<PostDetail> {
  return api.post<PostDetail>(`/posts/${id}/rollback/${versionId}`)
}

export function fetchCategories(): Promise<CategorySummary[]> {
  return api.get<CategorySummary[]>('/categories')
}

export function fetchTags(): Promise<TagSummary[]> {
  return api.get<TagSummary[]>('/tags')
}
