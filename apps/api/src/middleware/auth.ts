import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import type { Role, User } from '@educms/shared'
import { env } from '../config/env.js'
import { getAuthenticatedUser } from '../services/auth.service.js'
import type { TokenPayload } from '../services/auth.service.js'
import { forbidden, unauthorized } from '../utils/httpError.js'

declare module 'express-serve-static-core' {
  interface Request {
    /** Authenticated user, set by authMiddleware. */
    user?: User
  }
}

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  // The auth scheme is case-insensitive per RFC 9110.
  if (!header || !/^bearer /i.test(header)) {
    throw unauthorized('Authentication required')
  }

  const token = header.slice('bearer '.length)
  let payload: TokenPayload
  try {
    payload = jwt.verify(token, env.jwtSecret) as unknown as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized('Token has expired')
    }
    throw unauthorized('Invalid token')
  }

  // Load the user on every request so role changes and deactivation
  // take effect immediately, not at token expiry.
  req.user = await getAuthenticatedUser(payload.sub)
  next()
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw unauthorized('Authentication required')
    }
    if (!roles.includes(req.user.role)) {
      throw forbidden('You do not have permission to do this')
    }
    next()
  }
}
