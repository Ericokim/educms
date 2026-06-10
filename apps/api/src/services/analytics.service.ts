import type { DashboardData, PostAnalytics, UserAnalytics } from '@educms/shared'
import {
  getAuthorPerformance,
  getCategoryPerformance,
  getCommentsByStatus,
  getDashboardStats,
  getPendingComments,
  getPostsPerMonth,
  getRecentActivity,
  getRecentPosts,
  getTopPosts,
  getUsersByRole,
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

export async function getPostAnalytics(): Promise<PostAnalytics> {
  const [topPosts, byCategory, postsPerMonth, commentsByStatus] = await Promise.all([
    getTopPosts(),
    getCategoryPerformance(),
    getPostsPerMonth(),
    getCommentsByStatus(),
  ])
  return { topPosts, byCategory, postsPerMonth, commentsByStatus }
}

export async function getUserAnalytics(): Promise<UserAnalytics> {
  const [byRole, authorPerformance] = await Promise.all([
    getUsersByRole(),
    getAuthorPerformance(),
  ])
  return { byRole, authorPerformance }
}
