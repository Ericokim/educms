import type { Response } from 'express'
import type { ApiError, ApiFieldError, ApiSuccess } from '@educms/shared'

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  status = 200
): void {
  const body: ApiSuccess<T> = { success: true, message, data }
  res.status(status).json(body)
}

export function sendError(
  res: Response,
  message: string,
  status = 500,
  errors: ApiFieldError[] = []
): void {
  const body: ApiError = { success: false, message, errors }
  res.status(status).json(body)
}
