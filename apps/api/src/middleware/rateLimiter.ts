import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { sendError } from '../utils/responses.js'

function createRateLimiter(limit: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.nodeEnv === 'test',
    handler: (_req, res) => {
      sendError(res, message, 429)
    },
  })
}

export const apiRateLimiter = createRateLimiter(
  300,
  'Too many requests, please try again later'
)

// Stricter limit for credential guessing than the general API limiter.
export const loginRateLimiter = createRateLimiter(
  20,
  'Too many login attempts, please try again later'
)

// Comments are the only write any authenticated user can perform; keep the
// spam ceiling well below the general API limit.
export const commentRateLimiter = createRateLimiter(
  30,
  'You are commenting too quickly, please wait a moment'
)

// Uploads are expensive; limit how many one client can push per window.
export const uploadRateLimiter = createRateLimiter(
  60,
  'Too many uploads, please try again later'
)
