import type { PostAnalytics, UserAnalytics } from '@educms/shared'
import { api } from '@/lib/api'

export function fetchPostAnalytics(): Promise<PostAnalytics> {
  return api.get<PostAnalytics>('/analytics/posts')
}

export function fetchUserAnalytics(): Promise<UserAnalytics> {
  return api.get<UserAnalytics>('/analytics/users')
}
