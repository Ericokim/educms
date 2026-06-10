import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  ListMediaQuery,
  MediaItem,
  Paginated,
  UpdateMediaValues,
  User,
} from '@educms/shared'
import { ROLES } from '@educms/shared'
import { uploadDir } from '../middleware/upload.js'
import { logActivity } from '../repositories/activityLog.repository.js'
import * as media from '../repositories/media.repository.js'
import { fileMatchesMimeType } from '../utils/fileSignature.js'
import { badRequest, forbidden, notFound } from '../utils/httpError.js'

function assertCanManage(user: User, item: MediaItem): void {
  const canManageAll = user.role === ROLES.ADMIN || user.role === ROLES.EDITOR
  if (!canManageAll && item.uploadedById !== user.id) {
    throw forbidden('You can only manage media you uploaded')
  }
}

export function listMedia(query: ListMediaQuery): Promise<Paginated<MediaItem>> {
  return media.listMedia(query)
}

export async function createMedia(
  user: User,
  file: Express.Multer.File | undefined
): Promise<MediaItem> {
  if (!file) throw badRequest('No file uploaded. Send the file in a "file" form field.')

  // The Content-Type header is client-controlled; verify the actual bytes.
  if (!(await fileMatchesMimeType(file.path, file.mimetype))) {
    await fs.unlink(file.path).catch(() => {})
    throw badRequest('The file content does not match its declared type')
  }

  const id = await media.insertMedia({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    path: `/uploads/${file.filename}`,
    uploadedBy: user.id,
  })
  await logActivity(user.id, 'media.uploaded', 'media', id, { name: file.originalname })

  const created = await media.getMediaById(id)
  if (!created) throw notFound('Media not found')
  return created
}

export async function updateMedia(
  user: User,
  id: number,
  values: UpdateMediaValues
): Promise<MediaItem> {
  const existing = await media.getMediaById(id)
  if (!existing) throw notFound('Media not found')
  assertCanManage(user, existing)

  await media.updateMediaMeta(id, values.altText || null, values.caption || null)
  await logActivity(user.id, 'media.updated', 'media', id)

  const updated = await media.getMediaById(id)
  if (!updated) throw notFound('Media not found')
  return updated
}

export async function deleteMedia(user: User, id: number): Promise<void> {
  const existing = await media.getMediaById(id)
  if (!existing) throw notFound('Media not found')
  assertCanManage(user, existing)

  await media.deleteMediaRow(id)
  // Remove the file after the row: a stray file is recoverable, a DB row
  // pointing at a missing file is a broken image.
  try {
    await fs.unlink(path.join(uploadDir, existing.filename))
  } catch (error) {
    console.error(`Failed to remove media file ${existing.filename}:`, error)
  }
  await logActivity(user.id, 'media.deleted', 'media', id, { name: existing.originalName })
}
