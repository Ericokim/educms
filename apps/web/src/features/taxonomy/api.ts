import type {
  CategoryFormValues,
  CategoryItem,
  TagFormValues,
  TagItem,
} from '@educms/shared'
import { api } from '@/lib/api'

export function fetchCategories(): Promise<CategoryItem[]> {
  return api.get<CategoryItem[]>('/categories')
}

export function createCategory(values: CategoryFormValues): Promise<{ id: number }> {
  return api.post<{ id: number }>('/categories', values)
}

export function updateCategory(id: number, values: CategoryFormValues): Promise<null> {
  return api.patch<null>(`/categories/${id}`, values)
}

export function deleteCategory(id: number): Promise<null> {
  return api.delete<null>(`/categories/${id}`)
}

export function fetchTags(): Promise<TagItem[]> {
  return api.get<TagItem[]>('/tags')
}

export function createTag(values: TagFormValues): Promise<{ id: number }> {
  return api.post<{ id: number }>('/tags', values)
}

export function updateTag(id: number, values: TagFormValues): Promise<null> {
  return api.patch<null>(`/tags/${id}`, values)
}

export function deleteTag(id: number): Promise<null> {
  return api.delete<null>(`/tags/${id}`)
}
