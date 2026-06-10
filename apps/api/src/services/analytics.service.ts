import type { DashboardData } from '@educms/shared'
import {
  getDashboardStats,
  getPendingComments,
  getRecentActivity,
  getRecentPosts,
} from '../repositories/analytics.repository.js'

export async function getDashboard(): Promise<DashboardData> {
  const [stats, recentPosts, pendingComments, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentPosts(),
    getPendingComments(),
    getRecentActivity(),
  ])
  return { stats, recentPosts, pendingComments, recentActivity }
}
