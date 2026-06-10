import type { ApiFieldError } from '@educms/shared'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: ApiFieldError[] = []
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (message = 'Bad request', errors: ApiFieldError[] = []) =>
  new HttpError(400, message, errors)

export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, message)

export const forbidden = (message = 'You do not have permission to do this') =>
  new HttpError(403, message)

export const notFound = (message = 'Resource not found') => new HttpError(404, message)

export const conflict = (message = 'Resource already exists') => new HttpError(409, message)
