import type {
  Paginated,
  PublicCategory,
  PublicComment,
  PublicPostDetail,
  PublicPostSummary,
} from '@educms/shared'
import { api } from '@/lib/api'

export interface PublicPostFilters {
  page?: number
  limit?: number
  categorySlug?: string
  tagSlug?: string
  search?: string
  sort?: 'latest' | 'popular'
}

export function fetchPublicPosts(
  filters: PublicPostFilters
): Promise<Paginated<PublicPostSummary>> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug)
  if (filters.tagSlug) params.set('tagSlug', filters.tagSlug)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  const qs = params.toString()
  return api.get<Paginated<PublicPostSummary>>(`/public/posts${qs ? `?${qs}` : ''}`)
}

export function fetchPublicPost(slug: string): Promise<PublicPostDetail> {
  return api.get<PublicPostDetail>(`/public/posts/${slug}`)
}

export function fetchPublicCategories(): Promise<PublicCategory[]> {
  return api.get<PublicCategory[]>('/public/categories')
}

export function fetchPublicComments(slug: string): Promise<PublicComment[]> {
  return api.get<PublicComment[]>(`/public/posts/${slug}/comments`)
}

export function submitPublicComment(slug: string, content: string): Promise<null> {
  return api.post<null>(`/public/posts/${slug}/comments`, { content })
}

export function recordView(slug: string): Promise<null> {
  return api.post<null>(`/public/posts/${slug}/view`)
}
