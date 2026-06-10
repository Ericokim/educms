import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env.js'
import { badRequest } from '../utils/httpError.js'

/**
 * Allowed upload types. The stored extension comes from this map (never from
 * the client filename), so an uploaded "evil.php" can only ever land on disk
 * as <uuid>.<safe-ext>.
 */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export const uploadDir = path.resolve(env.uploadDir)
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    const extension = ALLOWED_MIME_TYPES[file.mimetype]
    callback(null, `${randomUUID()}.${extension}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: env.maxFileSize, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      callback(
        badRequest(
          `File type ${file.mimetype} is not allowed. Allowed: images (jpeg, png, gif, webp) and PDF.`
        )
      )
      return
    }
    callback(null, true)
  },
}).single('file')
