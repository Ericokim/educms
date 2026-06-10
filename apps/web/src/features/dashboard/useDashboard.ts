import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from './api'

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: fetchDashboard,
    enabled,
    staleTime: 60 * 1000,
  })
}
