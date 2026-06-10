import type { ListMediaQuery, MediaItem, Paginated } from '@educms/shared'
import { pool, query } from '../database/pool.js'

interface MediaRow {
  id: number
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  path: string
  alt_text: string | null
  caption: string | null
  uploaded_by: number | null
  uploaded_by_name: string | null
  created_at: Date
}

function toItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    url: row.path,
    altText: row.alt_text,
    caption: row.caption,
    uploadedById: row.uploaded_by,
    uploadedBy: row.uploaded_by_name,
    createdAt: row.created_at.toISOString(),
  }
}

const MEDIA_SELECT = `
  SELECT m.*, u.username AS uploaded_by_name
  FROM media m
  LEFT JOIN users u ON u.id = m.uploaded_by`

export async function listMedia(filters: ListMediaQuery): Promise<Paginated<MediaItem>> {
  const offset = (filters.page - 1) * filters.limit

  const [result, countResult] = await Promise.all([
    pool.query<MediaRow>(
      `${MEDIA_SELECT} ORDER BY m.created_at DESC LIMIT $1 OFFSET $2`,
      [filters.limit, offset]
    ),
    pool.query<{ total: string }>('SELECT count(*) AS total FROM media'),
  ])
  const total = Number(countResult.rows[0].total)

  return {
    items: result.rows.map(toItem),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  }
}

export async function getMediaById(id: number): Promise<MediaItem | null> {
  const result = await query<MediaRow>(`${MEDIA_SELECT} WHERE m.id = $1`, [id])
  return result.rows[0] ? toItem(result.rows[0]) : null
}

export interface MediaInsertData {
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  path: string
  uploadedBy: number
}

export async function insertMedia(data: MediaInsertData): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO media (filename, original_name, mime_type, size_bytes, path, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [data.filename, data.originalName, data.mimeType, data.sizeBytes, data.path, data.uploadedBy]
  )
  return result.rows[0].id
}

export async function updateMediaMeta(
  id: number,
  altText: string | null,
  caption: string | null
): Promise<void> {
  await query(
    'UPDATE media SET alt_text = $2, caption = $3, updated_at = now() WHERE id = $1',
    [id, altText, caption]
  )
}

export async function deleteMediaRow(id: number): Promise<void> {
  await query('DELETE FROM media WHERE id = $1', [id])
}
