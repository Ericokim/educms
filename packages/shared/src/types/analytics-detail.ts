import type { CommentStatus, PostStatus } from '../constants/status.js'
import type { Role } from '../constants/roles.js'

export interface TopPost {
  id: number
  title: string
  slug: string
  status: PostStatus
  author: string
  viewCount: number
}

export interface CategoryPerformance {
  category: string
  postCount: number
  totalViews: number
}

export interface MonthlyCount {
  month: string
  count: number
}

export interface CommentStatusCount {
  status: CommentStatus
  count: number
}

export interface PostAnalytics {
  topPosts: TopPost[]
  byCategory: CategoryPerformance[]
  postsPerMonth: MonthlyCount[]
  commentsByStatus: CommentStatusCount[]
}

export interface RoleCount {
  role: Role
  count: number
}

export interface AuthorPerformance {
  userId: number
  username: string
  postCount: number
  publishedCount: number
  totalViews: number
}

export interface UserAnalytics {
  byRole: RoleCount[]
  authorPerformance: AuthorPerformance[]
}
