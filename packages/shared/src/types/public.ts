import type { TagSummary } from './post.js'

export interface PublicPostSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  author: string
  categoryName: string | null
  categorySlug: string | null
  tags: TagSummary[]
  featuredImageUrl: string | null
  publishedAt: string
  viewCount: number
  readingMinutes: number
}

export interface PublicPostDetail extends PublicPostSummary {
  content: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  related: PublicPostSummary[]
}

export interface PublicCategory {
  id: number
  name: string
  slug: string
  description: string | null
  postCount: number
}

export interface PublicComment {
  id: number
  author: string
  content: string
  createdAt: string
}
