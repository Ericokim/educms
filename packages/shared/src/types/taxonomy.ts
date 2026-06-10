export interface CategoryItem {
  id: number
  name: string
  slug: string
  description: string | null
  postCount: number
}

export interface TagItem {
  id: number
  name: string
  slug: string
  postCount: number
}
