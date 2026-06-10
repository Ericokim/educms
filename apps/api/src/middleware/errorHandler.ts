import type { ErrorRequestHandler, RequestHandler } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { isProduction } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { sendError } from '../utils/responses.js'

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 'Resource not found', 404)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    sendError(res, err.message, err.status, err.errors)
    return
  }

  if (err instanceof ZodError) {
    sendError(
      res,
      'Validation failed',
      422,
      err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    )
    return
  }

  // Postgres constraint violations from invalid client references are the
  // client's fault, not a server failure.
  if (err && typeof err === 'object' && 'code' in err) {
    if (err.code === '23503') {
      sendError(res, 'A referenced resource does not exist', 400)
      return
    }
    if (err.code === '23505') {
      sendError(res, 'A resource with these details already exists', 409)
      return
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'The file is too large', 413)
      return
    }
    sendError(res, `Upload failed: ${err.message}`, 400)
    return
  }

  // Malformed JSON body rejected by express.json()
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    sendError(res, 'Invalid JSON in request body', 400)
    return
  }

  console.error('Unhandled error:', err)
  const message =
    isProduction || !(err instanceof Error) ? 'Internal server error' : err.message
  sendError(res, message, 500)
}
