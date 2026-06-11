import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { requestLogger } from './middleware/requestLogger.js'
import { uploadDir } from './middleware/upload.js'
import { scalarEnabled } from './routes/docs.routes.js'
import { apiRoutes } from './routes/index.js'

export const app = express()

// Behind a reverse proxy (Render/Railway/Fly), the client IP arrives in
// X-Forwarded-For; rate limiting needs it to bucket per client.
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1)
}

app.use(requestLogger)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))

app.use('/api', apiRateLimiter, apiRoutes)
// Uploaded files; the frontend on another origin embeds these images.
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', index: false }))

// Visiting the API origin directly lands on the interactive docs.
if (scalarEnabled) {
  app.get('/', (_req, res) => res.redirect('/api/docs'))
}

app.use(notFoundHandler)
app.use(errorHandler)
