export interface MediaItem {
  id: number
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
  altText: string | null
  caption: string | null
  uploadedById: number | null
  uploadedBy: string | null
  createdAt: string
}
