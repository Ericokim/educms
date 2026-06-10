import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

export interface RequestSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Parsed query set by validateRequest (req.query is read-only in Express 5). */
    validatedQuery?: unknown
    /** Parsed params set by validateRequest. */
    validatedParams?: unknown
  }
}

/**
 * Validates request parts against Zod schemas. Throws ZodError on failure,
 * which the central errorHandler turns into a 422 response with field errors.
 * The body is replaced with the parsed (and transformed) value; query and
 * params land on req.validatedQuery / req.validatedParams.
 */
export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body)
    }
    if (schemas.query) {
      req.validatedQuery = schemas.query.parse(req.query)
    }
    if (schemas.params) {
      req.validatedParams = schemas.params.parse(req.params)
    }
    next()
  }
}
