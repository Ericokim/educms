import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { sendError } from '../utils/responses.js'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later', 429)
  },
})
