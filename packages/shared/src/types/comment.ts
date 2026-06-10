import type { CommentStatus } from '../constants/status.js'

export interface CommentItem {
  id: number
  postId: number
  postTitle: string
  author: string
  content: string
  status: CommentStatus
  createdAt: string
}
