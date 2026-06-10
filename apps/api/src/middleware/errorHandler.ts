import type { ErrorRequestHandler, RequestHandler } from 'express'
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
