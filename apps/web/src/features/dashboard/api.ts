import type { DashboardData } from '@educms/shared'
import { api } from '@/lib/api'

export function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>('/analytics/dashboard')
}
