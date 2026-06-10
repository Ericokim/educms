import { useQuery } from '@tanstack/react-query'
import { fetchPostAnalytics, fetchUserAnalytics } from './api'

export function usePostAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'posts'],
    queryFn: fetchPostAnalytics,
    staleTime: 60 * 1000,
  })
}

export function useUserAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'users'],
    queryFn: fetchUserAnalytics,
    staleTime: 60 * 1000,
  })
}
