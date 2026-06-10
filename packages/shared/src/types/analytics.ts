import type { PostStatus } from '../constants/status.js'

export interface DashboardStats {
  publishedPosts: number
  draftPosts: number
  archivedPosts: number
  totalViews: number
  pendingComments: number
  activeUsers: number
  mediaCount: number
  categoriesCount: number
  tagsCount: number
}

export interface RecentPost {
  id: number
  title: string
  slug: string
  status: PostStatus
  author: string
  updatedAt: string
}

export interface PendingComment {
  id: number
  excerpt: string
  postTitle: string
  author: string
  createdAt: string
}

export interface ActivityEntry {
  id: number
  action: string
  entityType: string | null
  entityId: number | null
  username: string | null
  createdAt: string
}

export interface DashboardData {
  stats: DashboardStats
  recentPosts: RecentPost[]
  pendingComments: PendingComment[]
  recentActivity: ActivityEntry[]
}
