import type { PostStatus } from '../constants/status.js'

export interface TagSummary {
  id: number
  name: string
  slug: string
}

export interface CategorySummary {
  id: number
  name: string
  slug: string
}

export interface PostListItem {
  id: number
  title: string
  slug: string
  status: PostStatus
  excerpt: string | null
  authorId: number
  author: string
  categoryId: number | null
  categoryName: string | null
  tags: TagSummary[]
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostDetail extends PostListItem {
  content: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  featuredImageId: number | null
}

export interface PostVersionSummary {
  id: number
  versionNumber: number
  title: string
  status: PostStatus
  createdBy: string | null
  createdAt: string
}

export interface PostVersionDetail extends PostVersionSummary {
  content: string
  excerpt: string | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
}
