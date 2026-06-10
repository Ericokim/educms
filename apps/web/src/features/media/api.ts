import type { MediaItem, Paginated, UpdateMediaValues } from '@educms/shared'
import { api } from '@/lib/api'

export function fetchMedia(page: number, limit = 24): Promise<Paginated<MediaItem>> {
  return api.get<Paginated<MediaItem>>(`/media?page=${page}&limit=${limit}`)
}

export function uploadMedia(file: File): Promise<MediaItem> {
  const formData = new FormData()
  formData.append('file', file)
  return api.upload<MediaItem>('/media/upload', formData)
}

export function updateMedia(id: number, values: UpdateMediaValues): Promise<MediaItem> {
  return api.patch<MediaItem>(`/media/${id}`, values)
}

export function deleteMedia(id: number): Promise<null> {
  return api.delete<null>(`/media/${id}`)
}
